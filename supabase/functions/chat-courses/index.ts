// Edge function: stream Claude (Anthropic) responses for the dashboard AI search bar.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es l'assistant IA de "La Prépa du Peuple", une plateforme de cours pour étudiants en santé (PASS, L.AS, Collège/Lycée).
Tu réponds toujours en français, de manière claire, structurée et pédagogique.
Quand tu expliques un concept médical/scientifique :
- Utilise des listes à puces ou numérotées
- Mets en gras les termes clés (avec **terme**)
- Donne des exemples concrets
- Reste concis mais complet
Si on te demande de générer un QCM, propose 5 propositions (A, B, C, D, E) avec la correction et une justification courte par item.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Le champ 'messages' est requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        stream: true,
        messages: messages.map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content ?? ""),
        })),
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      console.error("Anthropic error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `Anthropic API erreur (${response.status})` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Re-stream in OpenAI-compatible SSE format so the client can use the standard parser.
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (!json || json === "[DONE]") continue;

              try {
                const evt = JSON.parse(json);
                if (
                  evt.type === "content_block_delta" &&
                  evt.delta?.type === "text_delta"
                ) {
                  const out = {
                    choices: [{ delta: { content: evt.delta.text } }],
                  };
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(out)}\n\n`)
                  );
                } else if (evt.type === "message_stop") {
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                }
              } catch {
                // ignore malformed event
              }
            }
          }
        } catch (e) {
          console.error("Stream error:", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("chat-courses error:", e);
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
