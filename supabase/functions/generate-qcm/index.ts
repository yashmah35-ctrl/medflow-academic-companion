import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractJson(text: string): any {
  let s = text.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/);
  if (fenced) s = fenced[1].trim();
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a !== -1 && b > a) s = s.slice(a, b + 1);
  return JSON.parse(s);
}

async function callGemini(systemPrompt: string, userText: string, imageDataUrl: string | null) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

  const userContent: any[] = [{ type: "text", text: userText }];
  if (imageDataUrl) userContent.push({ type: "image_url", image_url: { url: imageDataUrl } });

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Gemini empty response");
  return extractJson(text);
}

async function callClaude(systemPrompt: string, userText: string, fileBase64: string | null, fileMimeType: string | null) {
  const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY missing");

  const userContent: any[] = [];
  if (fileBase64) {
    const mime = fileMimeType || "application/pdf";
    if (mime === "application/pdf") {
      userContent.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } });
    } else {
      userContent.push({ type: "image", source: { type: "base64", media_type: mime, data: fileBase64 } });
    }
  }
  userContent.push({ type: "text", text: userText });

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!resp.ok) throw new Error(`Claude ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const text = data.content?.find((c: any) => c.type === "text")?.text;
  if (!text) throw new Error("Claude empty response");
  return extractJson(text);
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

    const { fileBase64, fileMimeType, content, subject, questionCount } = await req.json();
    if (!content && !fileBase64) {
      return new Response(JSON.stringify({ error: "Aucun contenu fourni." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const count = questionCount || 20;
    const subjectHint = subject ? ` (matière : ${subject})` : "";
    const systemPrompt = `Tu es un expert pédagogique pour étudiants PASS/LAS français. À partir du contenu fourni, génère exactement ${count} questions à choix multiples (QCM) de haute qualité, en français, dans le style des Khôlles classées du Tutorat Santé.

RÈGLES STRICTES :
- Chaque QCM a EXACTEMENT 5 propositions notées A, B, C, D, E.
- Plusieurs propositions peuvent être vraies (QCM multi-réponses).
- Les énoncés doivent commencer par une formule type "Parmi les propositions suivantes, laquelle (ou lesquelles) est (sont) vraie(s)" ou similaire.
- Les propositions doivent être précises, médicalement correctes et tirées du contenu fourni.
- Donne une explication concise et pédagogique pour chaque QCM.

Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après. Format:
{"questions": [{"question": "énoncé...", "propositions": [{"id":"A","text":"...","isCorrect":true},{"id":"B","text":"...","isCorrect":false},{"id":"C","text":"...","isCorrect":false},{"id":"D","text":"...","isCorrect":true},{"id":"E","text":"...","isCorrect":false}], "explanation": "explication globale"}]}

NE PAS entourer le JSON de \`\`\`json ou de \`\`\`. Réponds avec le JSON brut uniquement.`;

    const userText = fileBase64
      ? `À partir de ce cours${subjectHint}, génère exactement ${count} QCM de 5 propositions chacun pour évaluer la maîtrise des concepts clés.`
      : `À partir du contenu suivant${subjectHint}, génère exactement ${count} QCM de 5 propositions chacun.\n\nContenu :\n${(content || "").substring(0, 12000)}`;

    const isPdf = fileBase64 && (fileMimeType === "application/pdf");
    const isImage = fileBase64 && fileMimeType && fileMimeType.startsWith("image/");

    let result: any = null;
    let geminiErr: any = null;

    if (!isPdf) {
      try {
        const imageDataUrl = isImage ? `data:${fileMimeType};base64,${fileBase64}` : null;
        result = await callGemini(systemPrompt, userText, imageDataUrl);
      } catch (e) {
        geminiErr = e;
        console.warn("Gemini failed, falling back to Claude:", e instanceof Error ? e.message : e);
      }
    }

    if (!result) {
      try {
        result = await callClaude(systemPrompt, userText, fileBase64 || null, fileMimeType || null);
      } catch (e) {
        console.error("Claude fallback failed:", e);
        const msg = geminiErr ? `Gemini: ${geminiErr instanceof Error ? geminiErr.message : geminiErr} | Claude: ${e instanceof Error ? e.message : e}` : (e instanceof Error ? e.message : "Erreur IA");
        return new Response(JSON.stringify({ error: msg }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (Array.isArray(result.questions)) {
      result.questions = result.questions.map((q: any, i: number) => ({
        id: q.id || `q_${Date.now()}_${i}`,
        ...q,
      }));
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-qcm error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
