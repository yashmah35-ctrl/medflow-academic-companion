// Edge function MENTOR-GENERATE
// Génère un parcours pédagogique (8-12 exercices + QCM final 30 questions)
// à partir du contenu d'un cours (DOCX ou PDF) via Lovable AI Gemini 2.5 Pro
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import JSZip from "npm:jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MENTOR_SYSTEM_PROMPT = `TU ES MENTOR-GENERATOR, un moteur IA pédagogique spécialisé en médecine (PACES/PASS/LAS).
Tu génères automatiquement des parcours de révision et des quiz à partir des cours.

=== MISSION ===
À partir du contenu d'un cours, tu :
1. ANALYSES le contenu
2. GÉNÈRES un parcours de 8 à 12 exercices
3. CRÉES exactement 10 questions par exercice (5 niveaux Bloom)
4. CRÉES un QCM final de 30 questions

=== RÈGLES DE GÉNÉRATION ===
1. EXERCICES (8 à 12 par chapitre)
   - Exo 1-2 : Bloom 1 (Rappel) — définitions, identifications
   - Exo 3-4 : Bloom 2 (Compréhension) — explications, reformulations
   - Exo 5-6 : Bloom 3 (Application) — cas concrets, classifications
   - Exo 7-8 : Bloom 4 (Analyse) — comparaisons, raisonnements
   - Exo 9-10 : Bloom 5 (Synthèse) — problèmes ouverts
   - Exo 11-12 (optionnel) : Révision mixte tous niveaux

2. QUESTIONS (exactement 10 par exercice)
   - 4 options A, B, C, D
   - 1 seule bonne réponse (correctAnswer = index 0,1,2 ou 3)
   - hint : indice progressif (PAS la réponse)
   - explanation : explication scientifique complète
   - bridge : connexion avec une autre notion médicale

3. QCM FINAL (exactement 30 questions, mélange tous niveaux Bloom)

=== IMPORTANT ===
- Questions UNIQUEMENT basées sur le contenu fourni
- Ne JAMAIS inventer de notions absentes du cours
- Langage : français médical (terminologie PACES/PASS)
- Réponses mutuellement exclusives, pas d'ambiguïté
- Une seule bonne réponse par question`;

function extractPdfText(buffer: Uint8Array): string {
  // Extraction PDF basique : on cherche les blocs de texte entre BT...ET
  const text = new TextDecoder("latin1").decode(buffer);
  const matches = text.match(/\(([^)]{2,})\)/g) || [];
  return matches
    .map((m) => m.slice(1, -1))
    .filter((s) => /[a-zA-ZÀ-ÿ]{3,}/.test(s))
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, 30000);
}

const EXTERNAL_STORAGE_BASE = "https://tpvwxfbcdqpwvdwcrluy.supabase.co/storage/v1";
const EXTERNAL_BUCKET = "courses";
const LOVABLE_CLOUD_BUCKET = "course-files";

async function resolveFileUrl(filePathOrUrl: string, supabaseUrl: string): Promise<string> {
  if (filePathOrUrl.startsWith("http")) return filePathOrUrl;
  const encoded = filePathOrUrl.split("/").map(encodeURIComponent).join("/");

  // Try Lovable Cloud first
  const cloudUrl = `${supabaseUrl}/storage/v1/object/public/${LOVABLE_CLOUD_BUCKET}/${encoded}`;
  try {
    const head = await fetch(cloudUrl, { method: "HEAD" });
    if (head.ok) return cloudUrl;
  } catch { /* ignore */ }

  // Fallback external bucket
  return `${EXTERNAL_STORAGE_BASE}/object/public/${EXTERNAL_BUCKET}/${encoded}`;
}

async function extractDocxText(buffer: Uint8Array): Promise<string> {
  // Un DOCX est un ZIP contenant word/document.xml
  const zip = await JSZip.loadAsync(buffer);
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("DOCX invalide : word/document.xml introuvable");
  const xml = await docFile.async("string");
  // Extraction du texte : on prend tous les <w:t>...</w:t>
  const textMatches = xml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
  const text = textMatches
    .map((m) => m.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, ""))
    .join(" ")
    // Décodage des entités HTML basiques
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 30000);
}

async function extractTextFromUrl(filePathOrUrl: string, supabaseUrl: string): Promise<string> {
  const fileUrl = await resolveFileUrl(filePathOrUrl, supabaseUrl);
  console.log("[mentor-generate] Resolved file URL:", fileUrl);
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Téléchargement échoué : ${res.status} (${fileUrl})`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  console.log("[mentor-generate] Downloaded bytes:", buffer.byteLength);

  const lower = fileUrl.toLowerCase();
  if (lower.includes(".docx")) {
    return await extractDocxText(buffer);
  }
  if (lower.includes(".pdf")) {
    return extractPdfText(buffer);
  }
  // Fallback texte brut
  return new TextDecoder().decode(buffer).slice(0, 30000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY manquant" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Vérifier rôle admin
    const { data: roleRow } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "prepa_du_peuple")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Réservé aux administrateurs" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { courseId } = await req.json();
    if (!courseId) {
      return new Response(JSON.stringify({ error: "courseId requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role pour lire le cours et écrire le parcours
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: course, error: courseErr } = await admin
      .from("courses")
      .select("id, title, file_url, content, folder_id, folders(subject_id)")
      .eq("id", courseId)
      .single();

    if (courseErr || !course) {
      return new Response(JSON.stringify({ error: "Cours introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extraction du texte du cours (priorité au file_url, fallback content)
    let courseText = "";
    if (course.file_url) {
      try {
        courseText = await extractTextFromUrl(course.file_url, SUPABASE_URL);
      } catch (e) {
        console.error("Extraction file_url failed:", e);
      }
    }
    if (!courseText && course.content) {
      courseText = course.content.slice(0, 30000);
    }

    if (!courseText || courseText.length < 200) {
      return new Response(
        JSON.stringify({
          error:
            "Contenu du cours trop court ou vide. Vérifie que le fichier DOCX/PDF est bien lisible.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subjectId = (course.folders as any)?.subject_id;

    // ============================================================
    // STRATÉGIE : 2 APPELS PARALLÈLES à Claude Sonnet 4.5
    // - Appel 1 : 8 exercices × 10 questions = 80 questions
    // - Appel 2 : 1 QCM final de 30 questions
    // Cela évite le timeout edge function (~150s) car chaque appel
    // génère ~50% de moins de tokens et tourne en parallèle.
    // ============================================================

    const callClaude = async (
      userPrompt: string,
      toolName: string,
      toolDescription: string,
      inputSchema: any,
    ) => {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 12000,
          system: MENTOR_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
          tools: [{ name: toolName, description: toolDescription, input_schema: inputSchema }],
          tool_choice: { type: "tool", name: toolName },
        }),
      });
      return res;
    };

    const exercisesSchema = {
      type: "object",
      properties: {
        exercises: {
          type: "array",
          description: "Exactement 8 exercices, chacun avec exactement 10 questions",
          items: {
            type: "object",
            properties: {
              number: { type: "number" },
              title: { type: "string" },
              bloomTarget: { type: "number", description: "Niveau Bloom cible 1-5" },
              questions: {
                type: "array",
                description: "Exactement 10 questions",
                items: {
                  type: "object",
                  properties: {
                    statement: { type: "string" },
                    options: { type: "array", description: "Exactement 4 options", items: { type: "string" } },
                    correctAnswer: { type: "number", description: "Index 0-3" },
                    hint: { type: "string" },
                    explanation: { type: "string" },
                    bridge: { type: "string" },
                    bloomLevel: { type: "number" },
                  },
                  required: ["statement", "options", "correctAnswer", "explanation", "bloomLevel"],
                },
              },
            },
            required: ["number", "title", "bloomTarget", "questions"],
          },
        },
      },
      required: ["exercises"],
    };

    const qcmSchema = {
      type: "object",
      properties: {
        title: { type: "string" },
        questions: {
          type: "array",
          description: "Exactement 30 questions mélangeant tous les niveaux Bloom",
          items: {
            type: "object",
            properties: {
              statement: { type: "string" },
              options: { type: "array", description: "Exactement 4 options", items: { type: "string" } },
              correctAnswer: { type: "number" },
              hint: { type: "string" },
              explanation: { type: "string" },
              bridge: { type: "string" },
              bloomLevel: { type: "number" },
            },
            required: ["statement", "options", "correctAnswer", "explanation", "bloomLevel"],
          },
        },
      },
      required: ["title", "questions"],
    };

    const exercisesPrompt = `CHAPITRE : ${course.title}\n\nCONTENU DU COURS :\n${courseText}\n\nGénère EXACTEMENT 8 exercices de 10 questions chacun (80 questions au total). Progression Bloom : Exo 1-2 (Bloom 1 Rappel), Exo 3-4 (Bloom 2 Compréhension), Exo 5-6 (Bloom 3 Application), Exo 7-8 (Bloom 4-5 Analyse/Synthèse). Utilise OBLIGATOIREMENT l'outil create_exercises.`;

    const qcmPrompt = `CHAPITRE : ${course.title}\n\nCONTENU DU COURS :\n${courseText}\n\nGénère EXACTEMENT 30 questions de QCM final mélangeant tous les niveaux Bloom (rappel, compréhension, application, analyse, synthèse). Utilise OBLIGATOIREMENT l'outil create_qcm_final.`;

    // Appels parallèles
    const [exercisesRes, qcmRes] = await Promise.all([
      callClaude(exercisesPrompt, "create_exercises", "Crée 8 exercices de 10 questions", exercisesSchema),
      callClaude(qcmPrompt, "create_qcm_final", "Crée le QCM final de 30 questions", qcmSchema),
    ]);

    // Vérification erreurs
    for (const [label, res] of [["exercises", exercisesRes], ["qcm", qcmRes]] as const) {
      if (!res.ok) {
        const txt = await res.text();
        console.error(`Anthropic API error (${label}):`, res.status, txt);
        if (res.status === 429) {
          return new Response(
            JSON.stringify({ error: "Trop de requêtes Claude, réessaie dans une minute." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (res.status === 401) {
          return new Response(
            JSON.stringify({ error: "Clé API Claude invalide" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({ error: `Erreur génération Claude (${label}): ` + txt.slice(0, 200) }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const exercisesData = await exercisesRes.json();
    const qcmData = await qcmRes.json();

    const exercisesTool = exercisesData.content?.find((c: any) => c.type === "tool_use");
    const qcmTool = qcmData.content?.find((c: any) => c.type === "tool_use");

    if (!exercisesTool || !qcmTool) {
      console.error("Pas de tool_use", { exercisesData: JSON.stringify(exercisesData).slice(0, 300), qcmData: JSON.stringify(qcmData).slice(0, 300) });
      return new Response(JSON.stringify({ error: "Réponse Claude invalide (pas de tool_use)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const exercises = exercisesTool.input.exercises;
    const qcmFinal = qcmTool.input;

    if (!Array.isArray(exercises) || exercises.length === 0) {
      console.error("Exercises vide dans la réponse Claude");
      return new Response(JSON.stringify({ error: "Claude n'a pas généré d'exercices" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normaliser au format attendu par le frontend (Subject/Chapter/Exercise/Question)
    const normalizedExercises = exercises.map((ex: any, idx: number) => ({
      id: `exo-${idx + 1}`,
      number: ex.number ?? idx + 1,
      title: ex.title,
      chapterId: courseId,
      subjectId: subjectId || "",
      status: idx === 0 ? "available" : "locked",
      score: null,
      stars: 0,
      attempts: 0,
      bestScore: null,
      bloomTarget: ex.bloomTarget,
      questions: ex.questions.map((q: any, qi: number) => ({
        id: `exo-${idx + 1}-q${qi + 1}`,
        type: "qcm",
        bloomLevel: q.bloomLevel,
        statement: q.statement,
        options: q.options,
        correctAnswer: q.correctAnswer,
        hint: q.hint,
        explanation: q.explanation,
        bridge: q.bridge,
      })),
    }));

    const normalizedQcm = {
      id: `qcm-final-${courseId}`,
      title: qcmFinal.title,
      questions: qcmFinal.questions.map((q: any, qi: number) => ({
        id: `qcm-q${qi + 1}`,
        type: "qcm",
        bloomLevel: q.bloomLevel,
        statement: q.statement,
        options: q.options,
        correctAnswer: q.correctAnswer,
        hint: q.hint,
        explanation: q.explanation,
        bridge: q.bridge,
      })),
      bestScore: null,
      bestTime: null,
      completed: false,
      stars: 0,
    };

    // Upsert dans mentor_chapters
    const { error: upErr } = await admin
      .from("mentor_chapters")
      .upsert(
        {
          course_id: courseId,
          subject_id: subjectId,
          chapter_title: course.title,
          exercises_json: normalizedExercises,
          qcm_final_json: normalizedQcm,
          generated_by: user.id,
          generation_model: "claude-sonnet-4-5-20250929",
          source_text_length: courseText.length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "course_id" },
      );

    if (upErr) {
      console.error("Upsert error:", upErr);
      return new Response(JSON.stringify({ error: "Sauvegarde échouée: " + upErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        exercisesCount: normalizedExercises.length,
        qcmQuestionsCount: normalizedQcm.questions.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("mentor-generate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
