import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBase64, fileMimeType, format, fileText } = await req.json();

    if (!fileBase64 && !fileText) {
      return new Response(
        JSON.stringify({ error: "Aucun fichier fourni." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const mimeType = fileMimeType || "image/jpeg";
    const formatHint = format === "QIM" ? "QIM (vrai/faux pour chaque proposition)" : "QCM (une ou plusieurs bonnes réponses)";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en extraction de questions médicales (QCM/QIM). Extrais TOUTES les questions du document et leurs propositions A, B, C, D, E. Format : ${formatHint}.

Règles STRICTES :
- Pour chaque proposition, lis attentivement la correction fournie dans le document (V/F, Vrai/Faux, ✓/✗, "correct"/"incorrect", surlignage, etc.) et renseigne isCorrect en conséquence.
- Si une explication/justification est donnée pour une proposition (souvent après "Explication :", "Justification :", "Car...", "En effet..."), extrais-la dans le champ explanation de cette proposition.
- Ne JAMAIS inventer : si la correction d'une proposition n'apparaît pas, mets isCorrect=false et laisse explanation vide.
- Conserve exactement l'énoncé et le texte des propositions tels qu'ils sont écrits.`,
          },
          {
            role: "user",
            content: fileText
              ? `Voici un document texte contenant des questions ${formatHint} avec leurs corrections (V/F) et explications déjà indiquées. Extrais TOUTES les questions, leurs 5 propositions A-E, le statut isCorrect (true/false) selon la correction fournie, et l'explication associée à chaque proposition lorsqu'elle est présente.\n\n---DOCUMENT---\n${fileText}\n---FIN---`
              : [
                  {
                    type: "image_url",
                    image_url: { url: `data:${mimeType};base64,${fileBase64}` },
                  },
                  {
                    type: "text",
                    text: `Extrais toutes les questions et propositions de ce document. Format attendu : ${formatHint}. Retourne les questions avec leurs propositions et indique si chaque proposition est correcte.`,
                  },
                ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_questions",
              description: "Extrait les questions et propositions d'un document scanné.",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string", description: "L'énoncé de la question" },
                        propositions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string", description: "Lettre de la proposition (A, B, C, D, E)" },
                              text: { type: "string", description: "Texte de la proposition" },
                              isCorrect: { type: "boolean", description: "true si la proposition est marquée correcte (V/Vrai) dans le document, false sinon (F/Faux ou non précisée)" },
                              explanation: { type: "string", description: "Explication/justification associée à la proposition si présente dans le document, sinon chaîne vide" },
                            },
                            required: ["id", "text", "isCorrect", "explanation"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["question", "propositions"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessaie dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "L'IA n'a pas pu extraire les questions." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-kholle-questions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
