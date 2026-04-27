import { useEffect, useMemo, useState, useCallback } from "react";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useUserStats } from "@/hooks/useUserStats";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { DuolingoPath } from "./DuolingoPath";
import { QuizModal } from "./QuizModal";
import { QuizResult } from "./QuizResult";
import { DiagnosticModal } from "./DiagnosticModal";
import { QCMFinalModal } from "./QCMFinalModal";
import { QCMResult } from "./QCMResult";
import type {
  Exercise,
  StudentProfile,
  AnswerResult,
  ExerciseStatus,
  Question,
} from "./types";

interface MentorPanelProps {
  courseId: string;
  subjectId: string;
  subjectName: string;
  courseTitle: string;
}

interface MentorChapterRow {
  id: string;
  course_id: string;
  subject_id: string;
  chapter_title: string;
  exercises_json: any;
  qcm_final_json: any;
}

interface ProgressRow {
  exercise_id: string;
  is_qcm_final: boolean;
  status: string;
  best_score: number | null;
  stars: number;
  attempts: number;
}

const defaultProfile: StudentProfile = {
  confidenceLevel: 5,
  chapterStatus: "skimmed",
  sessionType: "deep",
  learningMode: "connections",
  examType: null,
  examDate: null,
  completedDiagnostic: false,
};

export function MentorPanel({ courseId, subjectId, subjectName, courseTitle }: MentorPanelProps) {
  const { user } = useAuth();
  const { balance: credits, refresh: refreshCredits } = useCredits();
  const { addXP } = useUserStats();
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<MentorChapterRow | null>(null);
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);

  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [showQCMFinal, setShowQCMFinal] = useState(false);
  const [showQCMResult, setShowQCMResult] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [lastResults, setLastResults] = useState<AnswerResult[]>([]);
  const [lastScore, setLastScore] = useState(0);
  const [lastStars, setLastStars] = useState(0);
  const [qcmScore, setQcmScore] = useState(0);
  const [qcmStars, setQcmStars] = useState(0);
  const [qcmTime, setQcmTime] = useState(0);

  // Charger chapitre + progression + profil
  useEffect(() => {
    if (!user || !courseId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const [{ data: chap }, { data: prog }, { data: prof }] = await Promise.all([
        supabase.from("mentor_chapters").select("*").eq("course_id", courseId).maybeSingle(),
        supabase.from("mentor_progress").select("*").eq("user_id", user.id).eq("course_id", courseId),
        supabase.from("mentor_student_profile").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (cancelled) return;

      setChapter(chap as any);
      const progMap: Record<string, ProgressRow> = {};
      (prog || []).forEach((p: any) => {
        const key = p.is_qcm_final ? "qcm_final" : p.exercise_id;
        progMap[key] = p;
      });
      setProgress(progMap);

      if (prof) {
        setProfile({
          confidenceLevel: prof.confidence_level,
          chapterStatus: prof.chapter_status as any,
          sessionType: prof.session_type as any,
          learningMode: prof.learning_mode as any,
          examType: (prof.exam_type as any) || null,
          examDate: prof.exam_date,
          completedDiagnostic: prof.completed_diagnostic,
        });
        if (!prof.completed_diagnostic && chap) setShowDiagnostic(true);
      } else if (chap) {
        setShowDiagnostic(true);
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user, courseId]);

  // Construire les exercices avec leur statut depuis la progression
  const exercises = useMemo<Exercise[]>(() => {
    if (!chapter?.exercises_json) return [];
    const rawExercises = Array.isArray(chapter.exercises_json) ? chapter.exercises_json : [];

    // Construire d'abord les progressions pour chaque exercice
    const built = rawExercises.map((ex: any, idx: number) => {
      const id = ex.id || `exo-${idx + 1}`;
      const p = progress[id];
      const stars = p?.stars ?? 0;
      return {
        raw: ex,
        idx,
        id,
        p,
        stars,
      };
    });

    // Verrouillage en cascade : exo 1 toujours débloqué, les suivants requièrent ≥ 2 étoiles au précédent
    return built.map(({ raw, idx, id, p, stars }) => {
      let status: ExerciseStatus;
      if (p?.status === "perfect") status = "perfect";
      else if (p?.status === "passed") status = "passed";
      else if (p?.status === "failed") status = "failed";
      else {
        // Pas encore tenté : débloqué seulement si exo précédent a ≥ 2 étoiles
        if (idx === 0) {
          status = "available";
        } else {
          const prevStars = built[idx - 1].stars;
          status = prevStars >= 2 ? "available" : "locked";
        }
      }
      return {
        id,
        number: raw.number || idx + 1,
        title: raw.title || `Exercice ${idx + 1}`,
        chapterId: chapter.id,
        subjectId: chapter.subject_id,
        status,
        score: p?.best_score ?? null,
        stars,
        attempts: p?.attempts ?? 0,
        bestScore: p?.best_score ?? null,
        bloomTarget: raw.bloomTarget || 1,
        questions: (raw.questions || []) as Question[],
      };
    });
  }, [chapter, progress]);

  const completedExercises = exercises.filter((e) => e.status === "perfect" || e.status === "passed");
  const qcmFinalUnlocked = completedExercises.length >= 3;
  const qcmFinalProgress = progress["qcm_final"];
  const qcmFinalCompleted = qcmFinalProgress?.status === "perfect" || qcmFinalProgress?.status === "passed";

  // Diagnostic — sauvegarde cloud
  const handleDiagnosticComplete = useCallback(async (updates: Partial<StudentProfile>) => {
    if (!user) return;
    const merged = { ...profile, ...updates, completedDiagnostic: true };
    setProfile(merged);
    setShowDiagnostic(false);
    await supabase.from("mentor_student_profile").upsert({
      user_id: user.id,
      confidence_level: merged.confidenceLevel,
      chapter_status: merged.chapterStatus,
      session_type: merged.sessionType,
      learning_mode: merged.learningMode,
      exam_type: merged.examType,
      exam_date: merged.examDate,
      completed_diagnostic: true,
    }, { onConflict: "user_id" });
  }, [user, profile]);

  // Lancer un exercice → consomme 2 crédits
  const handleSelectExercise = useCallback(async (exercise: Exercise) => {
    if (!user) return;
    if (credits < 2) {
      toast.error("Crédits insuffisants (2 requis)");
      return;
    }
    if (!exercise.questions || exercise.questions.length === 0) {
      toast.error("Cet exercice n'a pas encore de questions générées");
      return;
    }
    const { data, error } = await supabase.rpc("consume_credits", {
      _user_id: user.id,
      _amount: 2,
      _reason: "mentor_exercise",
      _metadata: { exercise_id: exercise.id, course_id: courseId },
    });
    if (error || data === -1) {
      toast.error("Crédits insuffisants");
      return;
    }
    await refreshCredits();
    setCurrentExercise(exercise);
    setShowQuiz(true);
  }, [user, credits, courseId, refreshCredits]);

  // Lancer le QCM final → 5 crédits
  const handleSelectQCMFinal = useCallback(async () => {
    if (!user || !qcmFinalUnlocked || !chapter?.qcm_final_json) return;
    if (credits < 5) {
      toast.error("Crédits insuffisants (5 requis pour le QCM Final)");
      return;
    }
    const { data, error } = await supabase.rpc("consume_credits", {
      _user_id: user.id,
      _amount: 5,
      _reason: "mentor_qcm_final",
      _metadata: { course_id: courseId },
    });
    if (error || data === -1) {
      toast.error("Crédits insuffisants");
      return;
    }
    await refreshCredits();
    setShowQCMFinal(true);
  }, [user, credits, qcmFinalUnlocked, chapter, courseId, refreshCredits]);

  // Sauvegarder résultat exercice
  const handleQuizComplete = useCallback(async (results: AnswerResult[], score: number, stars: number) => {
    if (!user || !currentExercise) return;

    setLastResults(results);
    setLastScore(score);
    setLastStars(stars);
    setShowQuiz(false);
    setShowQuizResult(true);

    const status = stars === 3 ? "perfect" : stars >= 1 ? "passed" : "failed";
    const existing = progress[currentExercise.id];
    const newBest = Math.max(existing?.best_score ?? 0, score);
    const newStars = Math.max(existing?.stars ?? 0, stars);
    const nextAttempts = (existing?.attempts ?? 0) + 1;
    const optimisticRow: ProgressRow = {
      exercise_id: currentExercise.id,
      is_qcm_final: false,
      status,
      best_score: newBest,
      stars: newStars,
      attempts: nextAttempts,
    };

    setProgress((prev) => ({
      ...prev,
      [currentExercise.id]: optimisticRow,
    }));

    const { error } = await supabase.from("mentor_progress").upsert({
      user_id: user.id,
      course_id: courseId,
      exercise_id: currentExercise.id,
      is_qcm_final: false,
      status,
      score,
      best_score: newBest,
      stars: newStars,
      attempts: nextAttempts,
      last_attempted_at: new Date().toISOString(),
    }, { onConflict: "user_id,course_id,exercise_id" });

    if (error) {
      toast.error("Impossible de sauvegarder la progression de l'exercice");
      return;
    }

    // Récompenses
    await addXP(10);
    await supabase.rpc("refund_credits", {
      _user_id: user.id,
      _amount: 100,
      _reason: "mentor_exercise_completed",
    });
    await refreshCredits();
    toast.success("🎉 +10 XP et +100 crédits !");

    // Recharger progression
    const { data: prog } = await supabase.from("mentor_progress").select("*")
      .eq("user_id", user.id).eq("course_id", courseId);
    const progMap: Record<string, ProgressRow> = {};
    (prog || []).forEach((p: any) => {
      const key = p.is_qcm_final ? "qcm_final" : p.exercise_id;
      progMap[key] = p;
    });
    setProgress(progMap);
  }, [user, currentExercise, courseId, progress, addXP, refreshCredits]);

  const handleQCMComplete = useCallback(async (_r: AnswerResult[], score: number, stars: number, time: number) => {
    if (!user) return;
    setQcmScore(score);
    setQcmStars(stars);
    setQcmTime(time);
    setShowQCMFinal(false);
    setShowQCMResult(true);

    const status = score >= 27 ? "perfect" : score >= 21 ? "passed" : "failed";
    const existing = qcmFinalProgress;
    await supabase.from("mentor_progress").upsert({
      user_id: user.id,
      course_id: courseId,
      exercise_id: "qcm_final",
      is_qcm_final: true,
      status,
      score,
      best_score: Math.max(existing?.best_score ?? 0, score),
      stars: Math.max(existing?.stars ?? 0, stars),
      attempts: (existing?.attempts ?? 0) + 1,
      time_spent_seconds: time,
      last_attempted_at: new Date().toISOString(),
    }, { onConflict: "user_id,course_id,exercise_id" });

    // Récompenses QCM Final
    await addXP(10);
    await supabase.rpc("refund_credits", {
      _user_id: user.id,
      _amount: 100,
      _reason: "mentor_qcm_final_completed",
    });
    await refreshCredits();
    toast.success("🎉 +10 XP et +100 crédits pour le QCM Final !");
  }, [user, courseId, qcmFinalProgress, addXP, refreshCredits]);

  // Pas encore de parcours généré
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement de MENTOR...</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Parcours MENTOR</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Le parcours de révision n'est pas encore généré pour ce cours.
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
          <AlertCircle className="inline h-3 w-3 mr-1" />
          Demande à un administrateur de générer le parcours
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header MENTOR */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/mentor-avatar.png" alt="MENTOR" className="w-9 h-9 rounded-full" />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-sm leading-tight">MENTOR</h3>
            <p className="text-xs text-gray-400 truncate">{chapter.chapter_title}</p>
          </div>
          <button
            onClick={() => setShowDiagnostic(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-purple-500"
            title="Refaire le diagnostic"
          >
            <Sparkles size={16} />
          </button>
        </div>
      </div>

      {/* Stats compactes */}
      <div className="px-4 py-2 shrink-0">
        <div className="bg-white rounded-xl border border-gray-100 p-2.5 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {completedExercises.length}/{exercises.length} exercices
          </span>
          <span className="font-semibold text-amber-600">
            {credits} crédits
          </span>
        </div>
      </div>

      {/* Parcours Duolingo */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {exercises.length > 0 ? (
          <DuolingoPath
            exercises={exercises}
            currentExerciseId={currentExercise?.id || null}
            onSelectExercise={handleSelectExercise}
            onSelectQCMFinal={handleSelectQCMFinal}
            qcmFinalUnlocked={qcmFinalUnlocked}
            qcmFinalCompleted={qcmFinalCompleted}
          />
        ) : (
          <p className="text-sm text-center text-gray-400 mt-8">Aucun exercice généré</p>
        )}
      </div>

      {/* Bandeau coût */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
        <p className="text-xs text-gray-500 text-center">
          2 crédits/exercice · 5 crédits pour le QCM Final
        </p>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDiagnostic && (
          <DiagnosticModal chapterTitle={chapter.chapter_title} onComplete={handleDiagnosticComplete} />
        )}
        {showQuiz && currentExercise && (
          <QuizModal
            exercise={currentExercise}
            onClose={() => setShowQuiz(false)}
            onComplete={handleQuizComplete}
          />
        )}
        {showQuizResult && currentExercise && (
          <QuizResult
            score={lastScore}
            total={lastResults.length || 10}
            stars={lastStars}
            exerciseTitle={currentExercise.title}
            onRetry={() => { setShowQuizResult(false); handleSelectExercise(currentExercise); }}
            onContinue={() => setShowQuizResult(false)}
          />
        )}
        {showQCMFinal && chapter.qcm_final_json && (
          <QCMFinalModal
            questions={(chapter.qcm_final_json.questions || chapter.qcm_final_json) as Question[]}
            onClose={() => setShowQCMFinal(false)}
            onComplete={handleQCMComplete}
          />
        )}
        {showQCMResult && (
          <QCMResult
            score={qcmScore}
            total={30}
            stars={qcmStars}
            timeSeconds={qcmTime}
            chapterTitle={chapter.chapter_title}
            onRetry={() => { setShowQCMResult(false); handleSelectQCMFinal(); }}
            onHome={() => setShowQCMResult(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
