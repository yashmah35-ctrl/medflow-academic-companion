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
  folderId: string | null;
  createdAt: number;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReview: number;
  lastReviewed?: number;
}

export interface ErrorFolder {
  id: string;
  name: string;
  color: string | null;
  createdAt: number;
}

export type Difficulty = "again" | "hard" | "good" | "easy";

interface DBRow {
  id: string;
  subject: string;
  question: string;
  explanation: string;
  is_true: boolean;
  folder_id: string | null;
  interval_days: number;
  repetitions: number;
  ease_factor: number;
  next_review: string;
  last_reviewed: string | null;
  created_at: string;
}

interface DBFolder {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

const fromDB = (r: DBRow): MedicalError => ({
  id: r.id,
  subject: r.subject,
  question: r.question,
  explanation: r.explanation,
  isTrue: r.is_true,
  folderId: r.folder_id,
  interval: r.interval_days,
  repetitions: r.repetitions,
  easeFactor: Number(r.ease_factor),
  nextReview: new Date(r.next_review).getTime(),
  lastReviewed: r.last_reviewed ? new Date(r.last_reviewed).getTime() : undefined,
  createdAt: new Date(r.created_at).getTime(),
});

const folderFromDB = (f: DBFolder): ErrorFolder => ({
  id: f.id,
  name: f.name,
  color: f.color,
  createdAt: new Date(f.created_at).getTime(),
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
  const [folders, setFolders] = useState<ErrorFolder[]>([]);
  // activeFolder: "all" | "none" (sans dossier) | folder.id
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [activeSubject, setActiveSubject] = useState<string>("Toutes");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [errRes, folRes] = await Promise.all([
      supabase
        .from("medical_errors")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("error_folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
    ]);
    if (errRes.error || folRes.error) {
      toast.error("Erreur de chargement");
      setLoading(false);
      return;
    }
    setErrors(((errRes.data ?? []) as DBRow[]).map(fromDB));
    setFolders(((folRes.data ?? []) as DBFolder[]).map(folderFromDB));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addError = useCallback(
    async (input: {
      subject: string;
      question: string;
      explanation: string;
      isTrue: boolean;
      folderId?: string | null;
    }) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("medical_errors")
        .insert({
          user_id: user.id,
          subject: input.subject,
          question: input.question,
          explanation: input.explanation,
          is_true: input.isTrue,
          folder_id: input.folderId ?? null,
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

  const moveError = useCallback(
    async (id: string, folderId: string | null) => {
      // Optimistic
      setErrors((prev) =>
        prev.map((e) => (e.id === id ? { ...e, folderId } : e))
      );
      const { error } = await supabase
        .from("medical_errors")
        .update({ folder_id: folderId })
        .eq("id", id);
      if (error) {
        toast.error("Impossible de déplacer");
        reload();
        return;
      }
      toast.success(folderId ? "Erreur déplacée" : "Retirée du dossier");
    },
    [reload]
  );

  const updateReview = useCallback(
    async (id: string, difficulty: Difficulty) => {
      const current = errors.find((e) => e.id === id);
      if (!current) return;
      const updates = calculateNextReview(current, difficulty);
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

  // ===== Folder CRUD =====
  const createFolder = useCallback(
    async (name: string, color?: string | null) => {
      if (!user) return null;
      const trimmed = name.trim();
      if (!trimmed) return null;
      const { data, error } = await supabase
        .from("error_folders")
        .insert({ user_id: user.id, name: trimmed, color: color ?? null })
        .select("*")
        .single();
      if (error) {
        toast.error("Impossible de créer le dossier");
        return null;
      }
      const folder = folderFromDB(data as DBFolder);
      setFolders((prev) => [...prev, folder]);
      toast.success("Dossier créé");
      return folder;
    },
    [user]
  );

  const renameFolder = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: trimmed } : f)));
    const { error } = await supabase
      .from("error_folders")
      .update({ name: trimmed })
      .eq("id", id);
    if (error) {
      toast.error("Impossible de renommer");
      reload();
    }
  }, [reload]);

  const deleteFolder = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("error_folders").delete().eq("id", id);
      if (error) {
        toast.error("Impossible de supprimer le dossier");
        return;
      }
      setFolders((prev) => prev.filter((f) => f.id !== id));
      // Erreurs deviennent sans dossier (ON DELETE SET NULL)
      setErrors((prev) =>
        prev.map((e) => (e.folderId === id ? { ...e, folderId: null } : e))
      );
      if (activeFolder === id) setActiveFolder("all");
      toast.success("Dossier supprimé");
    },
    [activeFolder]
  );

  // ===== Filtres =====
  const byFolder = (e: MedicalError) => {
    if (activeFolder === "all") return true;
    if (activeFolder === "none") return e.folderId === null;
    return e.folderId === activeFolder;
  };
  const bySubject = (e: MedicalError) =>
    activeSubject === "Toutes" ? true : e.subject === activeSubject;

  const filteredErrors = errors.filter((e) => byFolder(e) && bySubject(e));

  const dueErrorsAll = errors.filter((e) => e.nextReview <= Date.now());
  const dueErrors = dueErrorsAll.filter((e) => byFolder(e) && bySubject(e));

  const subjects = Array.from(new Set(errors.map((e) => e.subject)));

  // Compteurs par dossier
  const folderCounts: Record<string, number> = { all: errors.length, none: 0 };
  errors.forEach((e) => {
    if (e.folderId === null) folderCounts.none = (folderCounts.none || 0) + 1;
    else folderCounts[e.folderId] = (folderCounts[e.folderId] || 0) + 1;
  });

  return {
    errors,
    filteredErrors,
    dueErrors,
    subjects,
    folders,
    activeSubject,
    setActiveSubject,
    activeFolder,
    setActiveFolder,
    folderCounts,
    addError,
    deleteError,
    moveError,
    updateReview,
    createFolder,
    renameFolder,
    deleteFolder,
    loading,
  };
}
