import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Utilisateur non authentifié" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { fileBase64, fileMimeType, content, subject, questionCount } = await req.json();

    if (!content && !fileBase64) {
      return new Response(JSON.stringify({ error: "Aucun contenu fourni." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

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

    const userContent: any[] = [];

    if (fileBase64) {
      const mimeType = fileMimeType || "application/pdf";
      if (mimeType === "application/pdf") {
        userContent.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: fileBase64 },
        });
      } else {
        userContent.push({
          type: "image",
          source: { type: "base64", media_type: mimeType, data: fileBase64 },
        });
      }
      userContent.push({
        type: "text",
        text: `À partir de ce cours${subjectHint}, génère exactement ${count} QCM de 5 propositions chacun pour évaluer la maîtrise des concepts clés.`,
      });
    } else {
      userContent.push({
        type: "text",
        text: `À partir du contenu suivant${subjectHint}, génère exactement ${count} QCM de 5 propositions chacun.\n\nContenu :\n${content.substring(0, 12000)}`,
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const textContent = data.content?.find((c: any) => c.type === "text")?.text;

    if (!textContent) {
      console.error("No text in Claude response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "L'IA n'a pas pu générer de QCM." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let jsonStr = textContent.trim();
    // Remove markdown code fences (closed or unclosed)
    const fencedMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/);
    if (fencedMatch) jsonStr = fencedMatch[1].trim();
    // Extract from first { to last }
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw text (first 500 chars):", textContent.slice(0, 500));
      console.error("Stop reason:", data.stop_reason);
      return new Response(
        JSON.stringify({
          error: data.stop_reason === "max_tokens"
            ? "La réponse de l'IA a été tronquée. Réessaie avec un PDF plus court."
            : "Réponse IA invalide. Réessaie.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure each question has an id
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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
