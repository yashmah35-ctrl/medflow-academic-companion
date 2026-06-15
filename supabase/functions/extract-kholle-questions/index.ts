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

async function extractWithClaude(
  systemPrompt: string,
  fileBase64: string | null,
  fileMimeType: string | null,
  fileText: string | null
) {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

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
      model: "claude-haiku-4-5-20251001",
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
    throw new Error(`Claude error ${resp.status}: ${t}`);
  }

  const data = await resp.json();
  const toolUse = data.content?.find((c: any) => c.type === "tool_use");
  if (!toolUse?.input) {
    throw new Error("Claude n'a pas renvoyé de résultat structuré");
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

    const formatHint = format === "QIM" ? "QIM (vrai/faux pour chaque proposition)" : "QCM (une ou plusieurs bonnes réponses)";
    const systemPrompt = buildSystemPrompt(formatHint);

    const result = await extractWithClaude(
      systemPrompt,
      fileBase64 || null,
      fileMimeType || null,
      fileText || null
    );

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
