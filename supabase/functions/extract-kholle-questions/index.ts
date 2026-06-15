import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTRACT_TOOL = {
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
              question: { type: "string" },
              propositions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    text: { type: "string" },
                    isCorrect: { type: "boolean" },
                    explanation: { type: "string" },
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
};

function buildSystemPrompt(formatHint: string) {
  return `Tu es un expert en extraction de questions médicales (QCM/QIM). Extrais TOUTES les questions du document et leurs propositions A, B, C, D, E. Format : ${formatHint}.

Règles STRICTES :
- Pour chaque proposition, lis attentivement la correction fournie dans le document (V/F, Vrai/Faux, ✓/✗, "correct"/"incorrect", surlignage, etc.) et renseigne isCorrect en conséquence.
- Si une explication/justification est donnée pour une proposition (souvent après "Explication :", "Justification :", "Car...", "En effet..."), extrais-la dans le champ explanation de cette proposition.
- Ne JAMAIS inventer : si la correction d'une proposition n'apparaît pas, mets isCorrect=false et laisse explanation vide.
- Conserve exactement l'énoncé et le texte des propositions tels qu'ils sont écrits.`;
}

async function callLovableAI(systemPrompt: string, userContent: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "function", function: { name: "extract_questions" } },
    }),
  });

  return resp;
}

async function callAnthropic(systemPrompt: string, userContent: any, fileBase64: string | null, fileMimeType: string | null, fileText: string | null) {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");

  // Build Anthropic-format content
  let content: any;
  if (fileText) {
    content = [{ type: "text", text: `Voici le document :\n\n${fileText}` }];
  } else if (fileBase64) {
    const mime = fileMimeType || "image/jpeg";
    const isImage = mime.startsWith("image/");
    content = [
      {
        type: isImage ? "image" : "document",
        source: {
          type: "base64",
          media_type: mime,
          data: fileBase64,
        },
      },
      { type: "text", text: "Extrais toutes les questions et propositions du document." },
    ];
  } else {
    throw new Error("No content");
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8192,
      system: systemPrompt,
      tools: [
        {
          name: EXTRACT_TOOL.function.name,
          description: EXTRACT_TOOL.function.description,
          input_schema: EXTRACT_TOOL.function.parameters,
        },
      ],
      tool_choice: { type: "tool", name: "extract_questions" },
      messages: [{ role: "user", content }],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Anthropic error ${resp.status}: ${t}`);
  }

  const data = await resp.json();
  const toolUse = data.content?.find((c: any) => c.type === "tool_use");
  if (!toolUse?.input) {
    throw new Error("Anthropic n'a pas renvoyé de tool_use");
  }
  return toolUse.input;
}

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

    const mimeType = fileMimeType || "image/jpeg";
    const formatHint = format === "QIM" ? "QIM (vrai/faux pour chaque proposition)" : "QCM (une ou plusieurs bonnes réponses)";
    const systemPrompt = buildSystemPrompt(formatHint);

    const userContent = fileText
      ? `Voici un document texte contenant des questions ${formatHint} avec leurs corrections (V/F) et explications déjà indiquées. Extrais TOUTES les questions, leurs 5 propositions A-E, le statut isCorrect (true/false) selon la correction fournie, et l'explication associée à chaque proposition lorsqu'elle est présente.\n\n---DOCUMENT---\n${fileText}\n---FIN---`
      : [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${fileBase64}` } },
          { type: "text", text: `Extrais toutes les questions et propositions de ce document. Format attendu : ${formatHint}. Retourne les questions avec leurs propositions et indique si chaque proposition est correcte.` },
        ];

    // 1) Try Lovable AI first
    let result: any = null;
    let lovableFailed = false;

    try {
      const response = await callLovableAI(systemPrompt, userContent);

      if (response.status === 402 || response.status === 429) {
        console.warn(`Lovable AI returned ${response.status}, falling back to Anthropic`);
        lovableFailed = true;
      } else if (!response.ok) {
        const t = await response.text();
        console.error("Lovable AI error:", response.status, t);
        lovableFailed = true;
      } else {
        const data = await response.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall?.function?.arguments) {
          console.error("No tool call from Lovable AI, falling back");
          lovableFailed = true;
        } else {
          result = JSON.parse(toolCall.function.arguments);
        }
      }
    } catch (e) {
      console.error("Lovable AI exception:", e);
      lovableFailed = true;
    }

    // 2) Fallback to Anthropic Claude
    if (lovableFailed) {
      try {
        result = await callAnthropic(systemPrompt, userContent, fileBase64 || null, fileMimeType || null, fileText || null);
        console.log("Anthropic fallback succeeded");
      } catch (e) {
        console.error("Anthropic fallback failed:", e);
        return new Response(
          JSON.stringify({ error: "Service IA indisponible (Lovable AI et Claude). Contactez l'administrateur." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

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
