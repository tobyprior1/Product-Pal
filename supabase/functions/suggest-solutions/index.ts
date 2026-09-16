import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { buildOpportunityContext } from "../_shared/tree-context.ts";
import { DEFAULT_SUGGEST_SOLUTIONS_PROMPT, VARIANT_B_STARTER_PROMPT } from "./prompts.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Suggestion {
  title: string;
  description: string;
  rationale: string;
  assumption?: string;
}


function parseSuggestions(raw: string): Suggestion[] {
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
      description: String(item?.description ?? "").trim(),
      rationale: String(item?.rationale ?? "").trim(),
      assumption: String(item?.assumption ?? "").trim(),

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
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const opportunityId = typeof body?.opportunityId === "string" ? body.opportunityId : "";
    if (!opportunityId) return json({ error: "opportunityId is required" }, 400);

    const fallback = (body?.opportunity ?? {}) as Record<string, any>;
    const steer = typeof body?.steer === "string" ? body.steer : undefined;
    const compare = body?.compare === true;

    const { context, opportunity, error: ctxError } = await buildOpportunityContext(
      supabase,
      opportunityId,
      { fallback, steer },
    );

    if (ctxError) return json({ error: ctxError }, 400);
    if (!opportunity && !fallback.title) {
      return json({ error: "Opportunity not found" }, 404);
    }
    if (opportunity && opportunity.type !== "Opportunity") {
      return json({ error: "Node is not an opportunity" }, 400);
    }

    // ---- Prompt variants (editable in-app, seeded on first use) ----
    const { data: promptRows } = await supabase
      .from("ai_prompts")
      .select("id,label,system_prompt,version,is_active,model")
      .eq("key", "suggest-solutions");

    let prompts = (promptRows ?? []) as Array<{
      id: string;
      label: string;
      system_prompt: string;
      version: number;
      is_active: boolean;
      model: string | null;
    }>;

    const missing = ["A", "B"].filter((label) => !prompts.some((p) => p.label === label));
    if (missing.length > 0) {
      const { data: inserted } = await supabase
        .from("ai_prompts")
        .insert(
          missing.map((label) => ({
            user_id: userId,
            key: "suggest-solutions",
            label,
            system_prompt:
              label === "A" ? DEFAULT_SUGGEST_SOLUTIONS_PROMPT : VARIANT_B_STARTER_PROMPT,
            version: 1,
            is_active: label === "A",
          })),
        )
        .select("id,label,system_prompt,version,is_active,model");
      prompts = [...prompts, ...((inserted ?? []) as typeof prompts)];
    }

    const promptA = prompts.find((p) => p.label === "A");
    const promptB = prompts.find((p) => p.label === "B");
    const activePrompt = prompts.find((p) => p.is_active) ?? promptA ?? promptB;

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return json({ error: "AI is not configured for this project." }, 500);

    const callGemini = (model: string, systemPrompt: string) =>
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

    // Free-tier limits are per model: a 429 means that model is out of quota for
    // now, so never retry it. A 503 is transient Google-side congestion, so the
    // first (preferred) model gets one fast retry before we fall back.
    const DEFAULT_CHAIN = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
    const ALLOWED_MODELS = new Set(DEFAULT_CHAIN);
    const chainFor = (preferred?: string | null) =>
      preferred && ALLOWED_MODELS.has(preferred)
        ? [preferred, ...DEFAULT_CHAIN.filter((m) => m !== preferred)]
        : DEFAULT_CHAIN;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const runVariant = async (
      systemPrompt: string,
      preferredModel?: string | null,
    ): Promise<{ suggestions?: Suggestion[]; error?: string; status?: number; model?: string }> => {
      let aiResponse: Response | undefined;
      let usedModel = "";
      const chain = chainFor(preferredModel);
      for (const [index, model] of chain.entries()) {
        usedModel = model;
        aiResponse = await callGemini(model, systemPrompt);
        if (aiResponse.status !== 503 && aiResponse.status !== 429) break;

        // One quick second chance for the preferred model on transient congestion.
        if (index === 0 && aiResponse.status === 503) {
          console.warn(`${model} returned 503, retrying once`);
          await sleep(500);
          aiResponse = await callGemini(model, systemPrompt);
          if (aiResponse.status !== 503 && aiResponse.status !== 429) break;
        }
        console.warn(`${model} returned ${aiResponse.status}, trying next model`);
      }
      const res = aiResponse!;

      if (!res.ok) {
        const detail = await res.text();
        console.error("Gemini API error", res.status, detail);
        if (res.status === 429) {
          return { error: "Gemini rate limit reached. Please try again in a moment.", status: 429 };
        }
        if (res.status === 401 || res.status === 403) {
          return { error: "The Gemini API key is invalid or lacks access.", status: 502 };
        }
        return { error: "The AI request failed. Please try again.", status: 502 };
      }

      const aiJson = await res.json();
      const content: string = aiJson?.choices?.[0]?.message?.content ?? "";
      const suggestions = parseSuggestions(content);
      if (suggestions.length === 0) {
        return { error: "The AI returned no usable suggestions. Try again.", status: 502 };
      }
      return { suggestions, model: usedModel };
    };

    if (compare) {
      if (!promptA || !promptB) {
        return json({ error: "Both prompt variants must exist to compare." }, 400);
      }
      const [resA, resB] = await Promise.all([
        runVariant(promptA.system_prompt, promptA.model),
        runVariant(promptB.system_prompt, promptB.model),
      ]);
      if (resA.error || resB.error) {
        return json({ error: resA.error ?? resB.error }, resA.status ?? resB.status ?? 502);
      }
      return json({
        compare: true,
        a: {
          promptId: promptA.id,
          label: "A",
          version: promptA.version,
          suggestions: resA.suggestions,
        },
        b: {
          promptId: promptB.id,
          label: "B",
          version: promptB.version,
          suggestions: resB.suggestions,
        },
      });
    }

    const systemPrompt = activePrompt?.system_prompt ?? DEFAULT_SUGGEST_SOLUTIONS_PROMPT;
    const result = await runVariant(systemPrompt, activePrompt?.model);
    if (result.error) return json({ error: result.error }, result.status ?? 502);

    return json({
      suggestions: result.suggestions,
      model: result.model,
      prompt: activePrompt
        ? { promptId: activePrompt.id, label: activePrompt.label, version: activePrompt.version }
        : null,
    });
  } catch (error) {
    console.error("suggest-solutions error", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
