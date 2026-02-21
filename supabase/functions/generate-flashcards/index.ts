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
    const { content, fileBase64, fileMimeType, subject, cardCount } = await req.json();

    if (!content && !fileBase64) {
      return new Response(
        JSON.stringify({ error: "Aucun contenu fourni." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const count = cardCount || 10;
    const subjectHint = subject ? ` (matière : ${subject})` : "";

    // Build message content - either text or multimodal with file
    const userContent: any[] = [];

    if (fileBase64) {
      // Send file as image_url (works for PDF/images with Gemini)
      const mimeType = fileMimeType || "application/pdf";
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${fileBase64}`,
        },
      });
      userContent.push({
        type: "text",
        text: `À partir de ce document${subjectHint}, génère exactement ${count} flashcards de qualité pour aider à mémoriser les concepts clés. Extrais les informations importantes et crée des questions/réponses précises.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `À partir du contenu suivant${subjectHint}, génère exactement ${count} flashcards de qualité.\n\nContenu :\n${content.substring(0, 8000)}`,
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en pédagogie médicale. Tu crées des flashcards de haute qualité pour aider les étudiants à mémoriser efficacement. Chaque flashcard doit être claire, concise et tester un concept précis. Pour les documents PDF ou Word, extrais d'abord le contenu puis génère les flashcards.",
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_flashcards",
              description: "Génère une liste de flashcards à partir du contenu fourni.",
              parameters: {
                type: "object",
                properties: {
                  flashcards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        front: { type: "string", description: "La question (recto de la carte)" },
                        back: { type: "string", description: "La réponse (verso de la carte)" },
                        explanation: { type: "string", description: "Explication complémentaire optionnelle" },
                      },
                      required: ["front", "back"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["flashcards"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_flashcards" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessaie dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ error: "L'IA n'a pas pu générer de flashcards." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-flashcards error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
