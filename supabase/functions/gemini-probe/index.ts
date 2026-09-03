const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "no key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Record<string, unknown>[] = [];
  for (const model of ["gemini-3.7-flash", "gemini-3.6-flash"]) {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                'You are a product discovery coach. Respond with json only in the shape {"suggestions":[{"title":"...","description":"...","rationale":"...","assumption":"..."}]} — exactly 5 suggestions.',
            },
            {
              role: "user",
              content:
                "OUTCOME: Increase activation rate\nOPPORTUNITY: Users abandon onboarding before first value",
            },
          ],
        }),
      },
    );
    const text = await res.text();
    results.push({ model, status: res.status, snippet: text.slice(0, 200) });
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
