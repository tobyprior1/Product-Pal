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

  const modelsRes = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
    { headers: { "x-goog-api-key": key } },
  );
  const modelsJson = await modelsRes.json().catch(() => ({}));
  const models = (modelsJson?.models ?? [])
    .map((m: any) => String(m?.name ?? "").replace("models/", ""))
    .filter((n: string) => n.includes("flash"));

  const test = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gemini-3.7-flash",
        messages: [{ role: "user", content: "ping" }],
      }),
    },
  );
  const testBody = await test.text();

  return new Response(
    JSON.stringify({
      flashModels: models,
      test37Status: test.status,
      test37Body: testBody.slice(0, 800),
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
