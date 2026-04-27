import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface MedicalError {
  id: string;
  subject: string;
  question: string;
  explanation: string;
  isTrue: boolean;
  createdAt: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: number;
  lastReviewed?: number;
}

export type Difficulty = "again" | "hard" | "good" | "easy";

export const SUBJECTS = [
  "Anatomie",
  "Physiologie",
  "Biochimie",
  "Pharmacologie",
  "Pathologie",
  "Chirurgie",
  "Médecine interne",
  "Pédiatrie",
  "Gynécologie",
  "Psychiatrie",
  "Dermatologie",
  "Neurologie",
  "Cardiologie",
  "Pneumologie",
  "Néphrologie",
  "Autre",
] as const;

interface DBRow {
  id: string;
  subject: string;
  question: string;
  explanation: string;
  is_true: boolean;
  interval_days: number;
  repetitions: number;
  ease_factor: number;
  next_review: string;
  last_reviewed: string | null;
  created_at: string;
}

const fromDB = (r: DBRow): MedicalError => ({
  id: r.id,
  subject: r.subject,
  question: r.question,
  explanation: r.explanation,
  isTrue: r.is_true,
  interval: r.interval_days,
  repetitions: r.repetitions,
  easeFactor: Number(r.ease_factor),
  nextReview: new Date(r.next_review).getTime(),
  lastReviewed: r.last_reviewed ? new Date(r.last_reviewed).getTime() : undefined,
  createdAt: new Date(r.created_at).getTime(),
});

function calculateNextReview(error: MedicalError, difficulty: Difficulty) {
  let { interval, repetitions, easeFactor } = error;

  if (difficulty === "again") {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    if (difficulty === "hard") {
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      interval = Math.max(1, Math.round(interval * 1.3));
    } else if (difficulty === "good") {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 3;
      else interval = Math.round(interval * easeFactor);
    } else if (difficulty === "easy") {
      easeFactor += 0.15;
      if (repetitions === 0) interval = 2;
      else if (repetitions === 1) interval = 4;
      else interval = Math.round(interval * easeFactor * 1.3);
    }
    repetitions += 1;
  }

  return {
    interval_days: interval,
    repetitions,
    ease_factor: Math.round(easeFactor * 100) / 100,
    next_review: new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString(),
    last_reviewed: new Date().toISOString(),
  };
}

export function useMedicalErrorBook() {
  const { user } = useAuth();
  const [errors, setErrors] = useState<MedicalError[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>("Toutes");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("medical_errors")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erreur de chargement");
      setLoading(false);
      return;
    }
    setErrors((data as DBRow[]).map(fromDB));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addError = useCallback(
    async (input: { subject: string; question: string; explanation: string; isTrue: boolean }) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("medical_errors")
        .insert({
          user_id: user.id,
          subject: input.subject,
          question: input.question,
          explanation: input.explanation,
          is_true: input.isTrue,
        })
        .select("*")
        .single();
      if (error) {
        toast.error("Impossible d'ajouter l'erreur");
        return;
      }
      setErrors((prev) => [fromDB(data as DBRow), ...prev]);
      toast.success("Erreur ajoutée");
    },
    [user]
  );

  const deleteError = useCallback(async (id: string) => {
    const { error } = await supabase.from("medical_errors").delete().eq("id", id);
    if (error) {
      toast.error("Impossible de supprimer");
      return;
    }
    setErrors((prev) => prev.filter((e) => e.id !== id));
    toast.success("Erreur supprimée");
  }, []);

  const updateReview = useCallback(
    async (id: string, difficulty: Difficulty) => {
      const current = errors.find((e) => e.id === id);
      if (!current) return;
      const updates = calculateNextReview(current, difficulty);
      // Optimistic
      setErrors((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                interval: updates.interval_days,
                repetitions: updates.repetitions,
                easeFactor: updates.ease_factor,
                nextReview: new Date(updates.next_review).getTime(),
                lastReviewed: new Date(updates.last_reviewed).getTime(),
              }
            : e
        )
      );
      const { error } = await supabase.from("medical_errors").update(updates).eq("id", id);
      if (error) {
        toast.error("Erreur de sauvegarde");
        reload();
      }
    },
    [errors, reload]
  );

  const filteredErrors =
    activeSubject === "Toutes" ? errors : errors.filter((e) => e.subject === activeSubject);

  const dueErrorsAll = errors.filter((e) => e.nextReview <= Date.now());
  const dueErrors =
    activeSubject === "Toutes"
      ? dueErrorsAll
      : dueErrorsAll.filter((e) => e.subject === activeSubject);

  const subjects = Array.from(new Set(errors.map((e) => e.subject)));

  return {
    errors,
    filteredErrors,
    dueErrors,
    subjects,
    activeSubject,
    setActiveSubject,
    addError,
    deleteError,
    updateReview,
    loading,
  };
}
