import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { buildOpportunityContext } from "../_shared/tree-context.ts";
import { SUGGEST_EXPERIMENTS_PROMPT } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface ExperimentSuggestion {
  title: string;
  assumption: string;
  hypothesis: string;
  method: string;
  successSignal: string;
}

const clip = (v: unknown, max = 400) => {
  const t = String(v ?? "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
};

function parseSuggestions(raw: string): ExperimentSuggestion[] {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return [];
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return [];
    }
  }
  const list = Array.isArray(parsed) ? parsed : (parsed as any)?.suggestions;
  if (!Array.isArray(list)) return [];
  return list
    .map((item: any) => ({
      title: String(item?.title ?? "").trim(),
      assumption: String(item?.assumption ?? "").trim(),
      hypothesis: String(item?.hypothesis ?? "").trim(),
      method: String(item?.method ?? "").trim(),
      successSignal: String(item?.successSignal ?? item?.success_signal ?? "").trim(),
    }))
    .filter((s) => s.title.length > 0)
    .slice(0, 6);
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
    const solutionId = typeof body?.solutionId === "string" ? body.solutionId : "";
    if (!solutionId) return json({ error: "solutionId is required" }, 400);

    const fallback = (body?.solution ?? {}) as Record<string, any>;
    const steer = typeof body?.steer === "string" ? body.steer : undefined;
    const exclude: string[] = Array.isArray(body?.exclude)
      ? body.exclude.map((t: unknown) => String(t ?? "").trim()).filter(Boolean).slice(0, 30)
      : [];

    const { data: solutionRow } = await supabase
      .from("nodes")
      .select("*")
      .eq("id", solutionId)
      .maybeSingle();

    if (solutionRow && solutionRow.type !== "Solution") {
      return json({ error: "Node is not a solution" }, 400);
    }
    if (!solutionRow && !fallback.title) {
      return json({ error: "Solution not found" }, 404);
    }

    const treeId = solutionRow?.tree_id ?? (typeof fallback.treeId === "string" ? fallback.treeId : undefined);
    const parentOpportunityId =
      solutionRow?.parent_id ?? (typeof fallback.parentId === "string" ? fallback.parentId : "");

    // Reuse the opportunity brief (product, team, outcome, opportunity, evidence,
    // constraints) and layer the solution on top.
    const { context: baseContext } = await buildOpportunityContext(
      supabase,
      parentOpportunityId || "00000000-0000-0000-0000-000000000000",
      { fallback: { treeId, title: fallback.opportunityTitle, outcomeTitle: fallback.outcomeTitle }, steer },
    );

    const solData = (solutionRow?.data ?? fallback.data ?? {}) as Record<string, any>;
    const solutionLines = [
      clip(solutionRow?.title ?? fallback.title, 200),
      solData.description ? `Description: ${clip(solData.description, 700)}` : null,
      solData.status ? `Delivery status: ${solData.status}` : null,
      solutionRow?.notes ? `Notes: ${clip(solutionRow.notes, 500)}` : null,
    ].filter(Boolean) as string[];

    let existingExperiments: string[] = [];
    if (treeId) {
      const { data: siblings } = await supabase
        .from("nodes")
        .select("id, parent_id, type, title, data")
        .eq("tree_id", treeId)
        .eq("parent_id", solutionId);
      existingExperiments = ((siblings ?? []) as any[])
        .filter((n) => n.type === "Experiment")
        .slice(0, 12)
        .map((n) => {
          const d = (n.data ?? {}) as Record<string, any>;
          return `${clip(n.title, 160)}${d.hypothesis ? ` — hypothesis: ${clip(d.hypothesis, 200)}` : ""}${
            d.resultSummary ? ` — result: ${clip(d.resultSummary, 200)}` : ""
          }`;
        });
    }

    const sections = [
      baseContext,
      `## PROPOSED SOLUTION (design tests for THIS)\n${solutionLines.map((l) => `- ${l}`).join("\n")}`,
      existingExperiments.length
        ? `## EXPERIMENTS ALREADY RUN OR PLANNED (do not repeat)\n${existingExperiments.map((l) => `- ${l}`).join("\n")}`
        : null,
      exclude.length
        ? `## ALREADY SUGGESTED (do not repeat or reword these)\n${exclude.map((t) => `- ${t}`).join("\n")}`
        : null,
    ].filter(Boolean);

    const context = sections.join("\n\n");

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return json({ error: "AI is not configured for this project." }, 500);

    const systemPrompt = `${SUGGEST_EXPERIMENTS_PROMPT}\n\nIMPORTANT: return exactly 3 suggestions — no more, no fewer.`;

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
    const suggestions = parseSuggestions(content);
    if (suggestions.length === 0) {
      return json({ error: "The AI returned no usable experiments. Try again." }, 502);
    }

    return json({ suggestions: suggestions.slice(0, 3), model: usedModel });
  } catch (error) {
    console.error("suggest-experiments error", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
