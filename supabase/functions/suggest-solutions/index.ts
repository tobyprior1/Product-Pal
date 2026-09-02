import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

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
    const opportunityId = typeof body?.opportunityId === "string" ? body.opportunityId : "";
    if (!opportunityId) return json({ error: "opportunityId is required" }, 400);

    const fallback = (body?.opportunity ?? {}) as Record<string, any>;
    const steer = typeof body?.steer === "string" ? body.steer : undefined;

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



    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) return json({ error: "AI is not configured for this project." }, 500);

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
            {
              role: "system",
              content:
                "You are a product discovery coach trained in Teresa Torres' continuous discovery habits. " +
                "You are given a structured brief with sections such as PRODUCT, OUTCOME, BROADER OPPORTUNITY, " +
                "OPPORTUNITY, NEIGHBOURING OPPORTUNITIES, ALREADY TRIED OR PLANNED, CUSTOMER EVIDENCE and CONSTRAINTS. " +
                "Ground every suggestion in that brief: respect the product, the outcome metric and the constraints, " +
                "never repeat or lightly reword anything under ALREADY TRIED OR PLANNED, and do not solve the " +
                "neighbouring opportunities. Where customer evidence exists, respond to it directly. " +
                "Each solution must be small, concrete and testable within a couple of weeks — never a large project " +
                "or a re-statement of the opportunity. Cover a range of approaches, from low-effort to more ambitious. " +
                "Respond with json only, in the shape " +
                '{"suggestions":[{"title":"...","description":"...","rationale":"...","assumption":"..."}]} — exactly 5 suggestions. ' +
                "title: max 8 words. description: 1-2 sentences on what would be built. " +
                "rationale: one short line on why it could move the opportunity metric, citing the evidence or context it draws on. " +
                "assumption: the single riskiest assumption this solution would test.",

            },
            { role: "user", content: context },
          ],
          response_format: { type: "json_object" },
        }),
      });

    let aiResponse = await callGemini("gemini-3.7-flash");
    if (aiResponse.status === 503 || aiResponse.status === 429) {
      console.warn("gemini-3.7-flash unavailable, falling back to gemini-3.6-flash");
      aiResponse = await callGemini("gemini-3.6-flash");
    }

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error("Gemini API error", aiResponse.status, detail);
      if (aiResponse.status === 429) {
        return json({ error: "Gemini rate limit reached. Please try again in a moment." }, 429);
      }
      if (aiResponse.status === 401 || aiResponse.status === 403) {
        return json({ error: "The Gemini API key is invalid or lacks access." }, 502);
      }
      return json({ error: "The AI request failed. Please try again." }, 502);
    }


    const aiJson = await aiResponse.json();
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "";
    const suggestions = parseSuggestions(content);

    if (suggestions.length === 0) {
      return json({ error: "The AI returned no usable suggestions. Try again." }, 502);
    }

    return json({ suggestions });
  } catch (error) {
    console.error("suggest-solutions error", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
