import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTRACT_PARAMETERS = {
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
};

function buildSystemPrompt(formatHint: string) {
  return `Tu es un expert en extraction de questions médicales (QCM/QIM). Extrais TOUTES les questions du document et leurs propositions A, B, C, D, E. Format : ${formatHint}.

Règles STRICTES :
- Pour chaque proposition, lis attentivement la correction fournie dans le document (V/F, Vrai/Faux, ✓/✗, "correct"/"incorrect", surlignage, etc.) et renseigne isCorrect en conséquence.
- Si une explication est présente, résume-la en UNE seule phrase courte (max 20 mots). Ne copie jamais le texte intégral.
- Ne JAMAIS inventer : si la correction d'une proposition n'apparaît pas, mets isCorrect=false et laisse explanation vide.
- Conserve exactement l'énoncé et le texte des propositions tels qu'ils sont écrits.`;
}

async function extractWithGemini(
  systemPrompt: string,
  fileBase64: string | null,
  fileMimeType: string | null,
  fileText: string | null
) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

  const userContent: any[] = [];
  if (fileText) {
    userContent.push({ type: "text", text: `Voici le document :\n\n${fileText}` });
  } else if (fileBase64) {
    const mime = fileMimeType || "image/jpeg";
    userContent.push({ type: "image_url", image_url: { url: `data:${mime};base64,${fileBase64}` } });
    userContent.push({ type: "text", text: "Extrais toutes les questions et propositions du document." });
  } else {
    throw new Error("No content");
  }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_questions",
            description: "Extrait les questions et propositions d'un document scanné.",
            parameters: EXTRACT_PARAMETERS,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_questions" } },
    }),
  });

  if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("Gemini: no tool call");
  return JSON.parse(args);
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
        source: { type: "base64", media_type: mime, data: fileBase64 },
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
      "anthropic-beta": "pdfs-2024-09-25",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system: systemPrompt,
      tools: [
        {
          name: "extract_questions",
          description: "Extrait les questions et propositions d'un document scanné.",
          input_schema: EXTRACT_PARAMETERS,
        },
      ],
      tool_choice: { type: "tool", name: "extract_questions" },
      messages: [{ role: "user", content }],
    }),
  });

  if (!resp.ok) throw new Error(`Claude ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const toolUse = data.content?.find((c: any) => c.type === "tool_use");
  if (!toolUse?.input) throw new Error("Claude n'a pas renvoyé de résultat structuré");
  return toolUse.input;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const { fileBase64, fileMimeType, format, fileText } = await req.json();
    if (!fileBase64 && !fileText) {
      return new Response(JSON.stringify({ error: "Aucun fichier fourni." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formatHint = format === "QIM" ? "QIM (vrai/faux pour chaque proposition)" : "QCM (une ou plusieurs bonnes réponses)";
    const systemPrompt = buildSystemPrompt(formatHint);

    const isPdf = fileBase64 && fileMimeType === "application/pdf";

    let result: any = null;
    let geminiErr: any = null;

    // Gemini gère texte + images. PDF → directement Claude.
    if (!isPdf) {
      try {
        result = await extractWithGemini(systemPrompt, fileBase64 || null, fileMimeType || null, fileText || null);
      } catch (e) {
        geminiErr = e;
        console.warn("Gemini failed, falling back to Claude:", e instanceof Error ? e.message : e);
      }
    }

    if (!result) {
      try {
        result = await extractWithClaude(systemPrompt, fileBase64 || null, fileMimeType || null, fileText || null);
      } catch (e) {
        console.error("Claude fallback failed:", e);
        const msg = geminiErr ? `Gemini: ${geminiErr instanceof Error ? geminiErr.message : geminiErr} | Claude: ${e instanceof Error ? e.message : e}` : (e instanceof Error ? e.message : "Erreur IA");
        return new Response(JSON.stringify({ error: msg }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-kholle-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
