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

    // Load the opportunity (RLS scopes this to the caller's own trees).
    const { data: opportunity, error: oppError } = await supabase
      .from("nodes")
      .select("*")
      .eq("id", opportunityId)
      .maybeSingle();

    if (oppError) return json({ error: oppError.message }, 400);
    if (!opportunity) return json({ error: "Opportunity not found" }, 404);
    if (opportunity.type !== "Opportunity") return json({ error: "Node is not an opportunity" }, 400);

    const { data: siblings } = await supabase
      .from("nodes")
      .select("title, type")
      .eq("tree_id", (opportunity as any).tree_id)
      .eq("parent_id", opportunityId);

    const { data: treeNodes } = await supabase
      .from("nodes")
      .select("title, type, data")
      .eq("tree_id", (opportunity as any).tree_id)
      .eq("type", "Outcome");

    const outcome = treeNodes?.[0] as any;
    const oppData = ((opportunity as any).data ?? {}) as Record<string, unknown>;
    const existingSolutions = (siblings ?? [])
      .filter((s: any) => s.type === "Solution")
      .map((s: any) => s.title);

    const context = [
      `Opportunity: ${(opportunity as any).title}`,
      oppData.evidenceSummary ? `Evidence / customer signal: ${oppData.evidenceSummary}` : null,
      Array.isArray(oppData.tags) && oppData.tags.length ? `Tags: ${(oppData.tags as string[]).join(", ")}` : null,
      oppData.status ? `Discovery status: ${oppData.status}` : null,
      outcome ? `Parent outcome: ${outcome.title}` : null,
      outcome?.data?.metric ? `Outcome metric: ${outcome.data.metric}` : null,
      existingSolutions.length
        ? `Solutions already mapped (do NOT repeat these): ${existingSolutions.join("; ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) return json({ error: "AI is not configured for this project." }, 500);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": lovableApiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a product discovery coach trained in Teresa Torres' continuous discovery habits. " +
              "Given an opportunity (a customer need, pain or desire), propose distinct candidate solutions. " +
              "Each solution must be small, concrete and testable within a couple of weeks — never a large project " +
              "or a re-statement of the opportunity. Cover a range of approaches, from low-effort to more ambitious. " +
              "Respond with json only, in the shape " +
              '{"suggestions":[{"title":"...","description":"...","rationale":"..."}]} — exactly 5 suggestions. ' +
              "title: max 8 words. description: 1-2 sentences on what would be built. " +
              "rationale: one short line on why it could move the opportunity.",
          },
          { role: "user", content: context },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error("AI gateway error", aiResponse.status, detail);
      if (aiResponse.status === 429) {
        return json({ error: "AI is busy right now. Please try again in a moment." }, 429);
      }
      if (aiResponse.status === 402) {
        return json({ error: "AI credits are exhausted. Add credits to keep using AI features." }, 402);
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
