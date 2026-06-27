// Edge function: stream chat — Gemini Flash via Lovable Gateway (primary), Claude Haiku (fallback).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es l'assistant IA de MedFlow - La Prépa du Peuple, une plateforme d'apprentissage pour étudiants en PASS et LAS en France.

RÈGLES ABSOLUES :
- Réponds UNIQUEMENT en français
- JAMAIS d'emojis
- JAMAIS de titres avec ## ou # sauf si la réponse est très longue et complexe
- JAMAIS de gras excessif (**mot**) — utilise le gras uniquement pour les termes médicaux importants
- Les listes sont acceptées uniquement si la question demande une énumération
- Pour une question simple, réponds en 1-3 paragraphes directs sans mise en forme
- Sois précis, concis et pédagogique
- Ton style : un professeur de médecine bienveillant qui explique clairement
- Termine par une courte question de vérification si pertinent

EXEMPLE DE BONNE RÉPONSE pour 'c'est quoi les 20 acides aminés' :
Les 20 acides aminés protéinogènes sont les briques élémentaires des protéines. On les classe en 4 groupes selon leurs propriétés : les apolaires (Ala, Val, Leu, Ile, Met, Phe, Trp, Pro), les polaires non chargés (Ser, Thr, Asn, Gln, Cys, Tyr), les basiques chargés positivement (Lys, Arg, His) et les acides chargés négativement (Asp, Glu). Retiens que 9 d'entre eux sont essentiels et doivent être apportés par l'alimentation car l'organisme ne peut pas les synthétiser.`;

const CREDIT_COST = 25;

async function openGeminiStream(messages: any[]): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content ?? ""),
        })),
      ],
    }),
  });

  if (!resp.ok || !resp.body) {
    const errText = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${errText}`);
  }
  return resp;
}

async function openClaudeStream(messages: any[]): Promise<Response> {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
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

  if (!resp.ok || !resp.body) {
    const errText = await resp.text();
    throw new Error(`Claude ${resp.status}: ${errText}`);
  }
  return resp;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentification requise" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Utilisateur non authentifié" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { messages, conversationId } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Le champ 'messages' est requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Déduction atomique des crédits
    const { data: newBalance, error: consumeErr } = await adminClient.rpc("consume_credits", {
      _user_id: user.id,
      _amount: CREDIT_COST,
      _reason: "ai_chat",
      _metadata: { messages_count: messages.length },
    });
    if (consumeErr) {
      console.error("consume_credits error:", consumeErr);
      return new Response(JSON.stringify({ error: "Erreur crédits" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (newBalance === -1) {
      return new Response(JSON.stringify({ error: "insufficient_credits", code: "INSUFFICIENT_CREDITS" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Crée/récupère la conversation
    let convId = conversationId;
    if (!convId) {
      const firstUserMsg = messages.find((m: any) => m.role === "user")?.content ?? "Conversation";
      const { data: conv, error: convErr } = await adminClient
        .from("ai_conversations")
        .insert({ user_id: user.id, title: String(firstUserMsg).slice(0, 80) })
        .select("id")
        .single();
      if (convErr) console.error("conv create error:", convErr);
      else convId = conv.id;
    }

    const lastUserMsg = messages[messages.length - 1];
    if (convId && lastUserMsg?.role === "user") {
      await adminClient.from("ai_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "user",
        content: String(lastUserMsg.content ?? ""),
        credits_spent: CREDIT_COST,
      });
    }

    const refundIfFailed = async () => {
      try {
        await adminClient.rpc("refund_credits", {
          _user_id: user.id,
          _amount: CREDIT_COST,
          _reason: "ai_chat_refund",
        });
      } catch (e) { console.error("refund failed:", e); }
    };

    // Tente Gemini en premier, fallback Claude si erreur initiale
    let upstream: Response;
    let provider: "gemini" | "claude" = "gemini";
    try {
      upstream = await openGeminiStream(messages);
    } catch (geminiErr) {
      console.warn("Gemini failed, falling back to Claude:", geminiErr instanceof Error ? geminiErr.message : geminiErr);
      try {
        upstream = await openClaudeStream(messages);
        provider = "claude";
      } catch (claudeErr) {
        console.error("Claude fallback failed:", claudeErr);
        await refundIfFailed();
        return new Response(
          JSON.stringify({ error: `IA indisponible (${claudeErr instanceof Error ? claudeErr.message : "erreur inconnue"})` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let assistantText = "";
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ meta: { conversation_id: convId, balance: newBalance, provider } })}\n\n`
        ));

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
              if (!json) continue;
              if (json === "[DONE]") {
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                continue;
              }

              try {
                const evt = JSON.parse(json);

                if (provider === "gemini") {
                  // OpenAI-compatible SSE: choices[0].delta.content
                  const delta = evt.choices?.[0]?.delta?.content;
                  if (typeof delta === "string" && delta.length > 0) {
                    assistantText += delta;
                    const out = { choices: [{ delta: { content: delta } }] };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(out)}\n\n`));
                  }
                  if (evt.choices?.[0]?.finish_reason) {
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  }
                } else {
                  // Anthropic stream events
                  if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                    assistantText += evt.delta.text;
                    const out = { choices: [{ delta: { content: evt.delta.text } }] };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(out)}\n\n`));
                  } else if (evt.type === "message_stop") {
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  }
                }
              } catch { /* ignore */ }
            }
          }

          if (convId && assistantText) {
            await adminClient.from("ai_messages").insert({
              conversation_id: convId,
              user_id: user.id,
              role: "assistant",
              content: assistantText,
              credits_spent: 0,
            });
          }
        } catch (e) {
          console.error("Stream error:", e);
          if (!assistantText) await refundIfFailed();
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
