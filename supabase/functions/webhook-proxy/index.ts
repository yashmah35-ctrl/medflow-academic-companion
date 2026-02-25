const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  console.log("[proxy] Received request:", req.method, req.url);

  if (req.method === "OPTIONS") {
    console.log("[proxy] Responding to OPTIONS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.error("[proxy] Method not allowed:", req.method);
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const rawBody = await req.text();
    console.log("[proxy] Raw body received:", rawBody);

    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch (e) {
      console.error("[proxy] Failed to parse JSON body:", e.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body", details: e.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { webhook_url, payload } = parsed;
    console.log("[proxy] webhook_url:", webhook_url);
    console.log("[proxy] payload:", JSON.stringify(payload));

    if (!webhook_url || !payload) {
      console.error("[proxy] Missing webhook_url or payload");
      return new Response(
        JSON.stringify({ error: "Missing webhook_url or payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[proxy] Forwarding POST to:", webhook_url);
    const response = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("[proxy] Upstream response status:", response.status);

    const responseText = await response.text();
    console.log("[proxy] Upstream response body:", responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[proxy] Unhandled error:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
