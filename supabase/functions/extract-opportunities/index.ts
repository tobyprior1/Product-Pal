import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { buildOpportunityContext, OUTCOME_ALIGNMENT_INSTRUCTION } from "../_shared/tree-context.ts";
import { EXTRACT_OPPORTUNITIES_PROMPT } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface ExtractedOpportunity {
  title: string;
  need: string;
  quote: string;
  whyItMatters: string;
  mentions?: number;
}

const clip = (v: unknown, max = 400) => {
  const t = String(v ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

function parseResult(raw: string): { participantName: string; opportunities: ExtractedOpportunity[] } {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return { participantName: "", opportunities: [] };
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return { participantName: "", opportunities: [] };
    }
  }
  const list = Array.isArray(parsed) ? parsed : parsed?.opportunities;
  const opportunities = Array.isArray(list)
    ? list
        .map((item: any) => ({
          title: String(item?.title ?? "").trim(),
          need: String(item?.need ?? item?.description ?? "").trim(),
          quote: String(item?.quote ?? item?.evidence_quote ?? "").trim(),
          whyItMatters: String(item?.whyItMatters ?? item?.why_it_matters ?? "").trim(),
          ...(Number(item?.mentions) > 0 ? { mentions: Math.round(Number(item.mentions)) } : {}),
        }))
        .filter((o) => o.title.length > 0)
        .slice(0, 6)
    : [];
  return { participantName: String(parsed?.participantName ?? "").trim(), opportunities };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authorization required" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return json({ error: "Invalid session" }, 401);

    const body = await req.json().catch(() => ({}));
    const transcript = String(body?.transcript ?? "").trim();
    const isCsv = body?.source === "csv";
    const feedbackCount = Math.max(0, Math.min(5000, Number(body?.feedbackCount) || 0));
    if (transcript.length < 40) {
      return json({ error: isCsv ? "That file doesn't have enough feedback text to analyse." : "Paste a longer transcript so the AI has something to work with." }, 400);
    }

    const treeId = typeof body?.treeId === "string" ? body.treeId : undefined;
    const outcomeTitle = typeof body?.outcomeTitle === "string" ? body.outcomeTitle : undefined;
    const participantName = clip(body?.participantName, 120);
    const exclude: string[] = Array.isArray(body?.exclude)
      ? body.exclude.map((t: unknown) => String(t ?? "").trim()).filter(Boolean).slice(0, 30)
      : [];

    // Reuse the shared brief for product, team and outcome context.
    const { context: baseContext } = await buildOpportunityContext(
      supabase,
      "00000000-0000-0000-0000-000000000000",
      { fallback: { treeId, outcomeTitle } },
    );

    let existing: string[] = [];
    if (treeId) {
      const { data: rows } = await supabase
        .from("nodes")
        .select("type, title")
        .eq("tree_id", treeId);
      existing = ((rows ?? []) as any[])
        .filter((n) => n.type === "Opportunity")
        .slice(0, 20)
        .map((n) => clip(n.title, 160));
    }

    const parentTitle = clip(body?.parentOpportunityTitle, 200);

    const sections = [
      baseContext,
      parentTitle
        ? `## TARGET PARENT OPPORTUNITY\nNew opportunities will be added as sub-opportunities of: "${parentTitle}". Only return needs that are a narrower part of this parent.`
        : null,
      existing.length
        ? `## EXISTING OPPORTUNITIES (do not repeat or reword these)\n${existing.map((t) => `- ${t}`).join("\n")}`
        : null,
      exclude.length
        ? `## ALREADY SUGGESTED (do not repeat or reword these)\n${exclude.map((t) => `- ${t}`).join("\n")}`
        : null,
      isCsv
        ? `## CUSTOMER FEEDBACK ROWS (${feedbackCount || "many"} responses; [brackets] = customer segment)\n${transcript.slice(0, 80000)}`
        : `## INTERVIEW TRANSCRIPT${participantName ? ` (participant: ${participantName})` : ""}\n${transcript.slice(0, 60000)}`,
    ].filter(Boolean);

    const context = sections.join("\n\n");

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return json({ error: "AI is not configured for this project." }, 500);

    const csvInstruction = `SOURCE: this is a spreadsheet of many short feedback responses, not one interview. Treat each numbered line as a separate customer. CLUSTER recurring needs across many rows into distinct themes instead of summarising single comments. For each opportunity add "mentions": the approximate number of rows that express it, and pick the most representative verbatim quote (copied exactly from one row). Order by mentions × relevance to the outcome. "participantName" must be an empty string.`;
    const systemPrompt = `${EXTRACT_OPPORTUNITIES_PROMPT}\n\n${OUTCOME_ALIGNMENT_INSTRUCTION}${isCsv ? `\n\n${csvInstruction}` : ""}\n\nIMPORTANT: return at most 5 opportunities, ordered by how strongly the ${isCsv ? "feedback" : "transcript"} supports them.`;

    const callGemini = (model: string) =>
      fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${geminiApiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: context },
          ],
        }),
      });

    // Per-model free-tier limits: 429 means out of quota (never retry), 503 is
    // transient congestion, so the preferred model gets one fast retry.
    const CHAIN = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let aiResponse: Response | undefined;
    let usedModel = "";
    for (const [index, model] of CHAIN.entries()) {
      usedModel = model;
      aiResponse = await callGemini(model);
      if (aiResponse.status !== 503 && aiResponse.status !== 429) break;
      if (index === 0 && aiResponse.status === 503) {
        console.warn(`${model} returned 503, retrying once`);
        await sleep(500);
        aiResponse = await callGemini(model);
        if (aiResponse.status !== 503 && aiResponse.status !== 429) break;
      }
      console.warn(`${model} returned ${aiResponse.status}, trying next model`);
    }

    const res = aiResponse!;
    if (!res.ok) {
      const detail = await res.text();
      console.error("Gemini API error", res.status, detail);
      if (res.status === 429) {
        return json({ error: "Gemini rate limit reached. Please try again in a moment." }, 429);
      }
      if (res.status === 401 || res.status === 403) {
        return json({ error: "The Gemini API key is invalid or lacks access." }, 502);
      }
      return json({ error: "The AI request failed. Please try again." }, 502);
    }

    const aiJson = await res.json();
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "";
    const result = parseResult(content);
    if (result.opportunities.length === 0) {
      console.error("No opportunities parsed", usedModel, JSON.stringify(content).slice(0, 800));
      return json({ error: "No clear customer needs came out of that transcript. Try a fuller one." }, 502);
    }

    return json({
      participantName: result.participantName || participantName,
      opportunities: result.opportunities.slice(0, 5),
      model: usedModel,
    });
  } catch (error) {
    console.error("extract-opportunities error", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
