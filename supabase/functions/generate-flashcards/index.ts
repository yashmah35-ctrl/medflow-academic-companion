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
      max_tokens: 4096,
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

    const { content, fileBase64, fileMimeType, subject, cardCount } = await req.json();
    if (!content && !fileBase64) {
      return new Response(JSON.stringify({ error: "Aucun contenu fourni." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const count = cardCount || 10;
    const subjectHint = subject ? ` (matière : ${subject})` : "";
    const systemPrompt = `Tu es un expert en médecine pour étudiants PASS/LAS français. À partir du contenu fourni, génère exactement ${count} flashcards médicales précises en français. Réponds UNIQUEMENT avec un JSON valide, sans texte avant ni après. Format: {"flashcards": [{"front": "question", "back": "réponse", "explanation": "explication optionnelle"}]}`;

    const userText = fileBase64
      ? `À partir de ce document${subjectHint}, génère exactement ${count} flashcards de qualité pour aider à mémoriser les concepts clés.`
      : `À partir du contenu suivant${subjectHint}, génère exactement ${count} flashcards de qualité.\n\nContenu :\n${(content || "").substring(0, 8000)}`;

    const isPdf = fileBase64 && (fileMimeType === "application/pdf");
    const isImage = fileBase64 && fileMimeType && fileMimeType.startsWith("image/");

    let result: any = null;
    let geminiErr: any = null;

    // Tente Gemini sauf si PDF (pas supporté en gateway OpenAI-compat)
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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-flashcards error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
