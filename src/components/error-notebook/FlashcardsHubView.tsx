import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, BookOpen, Eye, EyeOff, Trash2, AlertCircle,
  RefreshCw, Layers, ArrowLeft, FolderOpen, ClipboardList, FlaskConical,
  PenLine, RotateCcw, XCircle, AlertTriangle, CheckCircle2, Zap, Trophy,
  Brain, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  useMedicalErrorBook,
  type MedicalError,
  type Difficulty,
} from "@/hooks/useMedicalErrorBook";

// ====== Types pour les flashcards AUTO (table `errors`) ======
interface AutoError {
  id: string;
  question: string;
  wrong_answer: string;
  correct_answer: string;
  subject_name: string | null;
  source: string;
  occurrence_count: number;
  created_at: string;
  last_seen: string;
}

type SourceKey = "kholle" | "annale" | "exam" | "manual";

const AUTO_SOURCES: {
  key: Exclude<SourceKey, "manual">;
  label: string;
  icon: any;
  gradient: string;
  match: string[];
}[] = [
  { key: "kholle", label: "Khôlles", icon: GraduationCap, gradient: "from-blue-500/20 to-blue-600/5 border-blue-500/30", match: ["kholle"] },
  { key: "annale", label: "Annales", icon: ClipboardList, gradient: "from-purple-500/20 to-purple-600/5 border-purple-500/30", match: ["annale"] },
  { key: "exam", label: "Examens blancs", icon: FlaskConical, gradient: "from-amber-500/20 to-amber-600/5 border-amber-500/30", match: ["exam", "exam_blanc"] },
];

const MANUAL_SOURCE = {
  key: "manual" as const,
  label: "Manuelle",
  icon: PenLine,
  gradient: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
};

// ====================== AUTO FLASHCARD ITEM ======================
function AutoFlashcardItem({ err, onDelete }: { err: AutoError; onDelete: (id: string) => void }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-lg overflow-hidden border border-border bg-card shadow-sm"
    >
      <div className="flex flex-col md:flex-row min-h-[260px]">
        <div className="flex-1 p-6 md:p-8 relative border-b md:border-b-0 md:border-r border-border">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 flex-wrap justify-end max-w-[60%]">
            {err.occurrence_count > 1 && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <RefreshCw className="h-3 w-3" /> x{err.occurrence_count}
              </Badge>
            )}
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Question</span>
            </div>
            <p className="text-foreground leading-relaxed text-[15px] font-medium">{err.question}</p>
          </div>
          <div className="absolute bottom-4 left-6 md:left-8 text-[10px] text-muted-foreground">
            Vue le {new Date(err.last_seen).toLocaleDateString("fr-FR")}
          </div>
        </div>

        <div className="flex-1 p-6 md:p-8 relative bg-muted/30 cursor-pointer group" onClick={() => setRevealed(!revealed)}>
          {!revealed ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[180px] gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Cliquer pour révéler la réponse</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Réponse</span>
              </div>
              <p className="text-foreground leading-relaxed text-[15px] whitespace-pre-wrap">{err.correct_answer || "—"}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <EyeOff className="h-3 w-3" /> Cliquer pour masquer
              </div>
            </motion.div>
          )}

          <div className="absolute bottom-4 right-6 md:right-8 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" /> Supprimer cette flashcard ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>Cette flashcard sera retirée définitivement.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(err.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ====================== AUTO VIEW (Khôlles / Annales / Examens) ======================
function AutoSourceView({
  sourceKey,
  onBack,
}: {
  sourceKey: Exclude<SourceKey, "manual">;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [errors, setErrors] = useState<AutoError[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const src = AUTO_SOURCES.find((s) => s.key === sourceKey)!;

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("errors")
      .select("id, question, wrong_answer, correct_answer, subject_name, source, occurrence_count, created_at, last_seen")
      .eq("user_id", user.id)
      .in("source", src.match)
      .order("last_seen", { ascending: false })
      .limit(1000);
    if (error) toast.error("Erreur de chargement");
    else setErrors((data ?? []) as AutoError[]);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    setActiveSubject(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sourceKey]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("errors").delete().eq("id", id);
    if (error) return toast.error("Suppression impossible");
    setErrors((prev) => prev.filter((e) => e.id !== id));
    toast.success("Supprimée");
  };

  const subjectGroups = useMemo(() => {
    const map = new Map<string, AutoError[]>();
    for (const e of errors) {
      const key = e.subject_name || "Sans matière";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [errors]);

  const subjectErrors = useMemo(() => {
    if (!activeSubject) return [];
    return errors.filter((e) => (e.subject_name || "Sans matière") === activeSubject);
  }, [errors, activeSubject]);

  if (loading) return <div className="text-center text-muted-foreground py-20">Chargement...</div>;

  if (activeSubject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setActiveSubject(null)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Retour aux matières
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Layers className="h-3 w-3" />
              {subjectErrors.length} carte{subjectErrors.length > 1 ? "s" : ""}
            </Badge>
            <Button variant="outline" size="sm" onClick={reload} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Actualiser
            </Button>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{activeSubject}</h2>
          <p className="text-sm text-muted-foreground">{src.label}</p>
        </div>
        <AnimatePresence mode="popLayout">
          <div className="space-y-6">
            {subjectErrors.map((e) => (
              <AutoFlashcardItem key={e.id} err={e} onDelete={handleDelete} />
            ))}
          </div>
        </AnimatePresence>
      </div>
    );
  }

  const Icon = src.icon;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Retour aux catégories
        </Button>
        <Button variant="outline" size="sm" onClick={reload} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Actualiser
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{src.label}</h2>
          <p className="text-sm text-muted-foreground">Sélectionnez une matière</p>
        </div>
      </div>

      {subjectGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucune flashcard</h3>
          <p className="text-muted-foreground max-w-md">
            Les flashcards apparaîtront ici dès que vous aurez des erreurs dans cette catégorie.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subjectGroups.map(([subject, errs]) => (
            <motion.button
              key={subject}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              onClick={() => setActiveSubject(subject)}
              className="group relative flex flex-col items-start gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left"
            >
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="w-full">
                <h3 className="font-semibold text-foreground line-clamp-2 text-sm">{subject}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {errs.length} carte{errs.length > 1 ? "s" : ""}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ====================== MANUAL — SRS Flashcard Session ======================
function ManualFlashcardSession({
  cards,
  totalCount,
  folderName,
  onReview,
  onBackToFolders,
}: {
  cards: MedicalError[];
  totalCount: number;
  folderName: string;
  onReview: (id: string, difficulty: Difficulty) => void;
  onBackToFolders: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  useEffect(() => {
    setCurrentIndex(0);
    setFlipped(false);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
  }, [folderName]);

  const currentCard = cards[currentIndex];
  const progress =
    totalCount > 0 ? ((totalCount - cards.length + currentIndex) / totalCount) * 100 : 0;

  const handleDifficulty = (difficulty: Difficulty) => {
    if (!currentCard) return;
    onReview(currentCard.id, difficulty);
    setSessionStats((p) => ({ ...p, [difficulty]: p[difficulty] + 1 }));
    setDirection(1);
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((p) => p + 1);
      setDirection(0);
    }, 250);
  };

  const handleSkip = () => {
    if (cards.length === 0) return;
    setDirection(-1);
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((p) => (p + 1) % cards.length);
      setDirection(0);
    }, 250);
  };

  if (cards.length === 0 || !currentCard) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={onBackToFolders} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Retour aux dossiers
        </Button>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-6">
            <Trophy className="h-12 w-12 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Tout est révisé !</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Vous avez terminé toutes les cartes dues pour ce dossier.
          </p>
          {Object.values(sessionStats).some((v) => v > 0) && (
            <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
              <p className="text-sm font-medium text-foreground mb-3">Session</p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-red-500"><XCircle className="h-4 w-4" /> {sessionStats.again}</span>
                <span className="flex items-center gap-1 text-orange-500"><AlertTriangle className="h-4 w-4" /> {sessionStats.hard}</span>
                <span className="flex items-center gap-1 text-blue-500"><CheckCircle2 className="h-4 w-4" /> {sessionStats.good}</span>
                <span className="flex items-center gap-1 text-emerald-500"><Zap className="h-4 w-4" /> {sessionStats.easy}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBackToFolders} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Retour aux dossiers
        </Button>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>{currentIndex + 1} / {cards.length}</span>
          </div>
          <div className="w-32"><Progress value={progress} className="h-2" /></div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">{folderName}</h2>
        <p className="text-sm text-muted-foreground">Mode révision</p>
      </div>

      <div>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentCard.id}
            custom={direction}
            initial={{ x: direction * 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div
              className={`flip-card w-full ${flipped ? "flipped" : ""}`}
              style={{ height: "400px" }}
              onClick={() => setFlipped(!flipped)}
            >
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <div className="h-full w-full bg-card border border-border rounded-xl p-8 flex flex-col relative cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-6">
                      <Badge>{currentCard.subject}</Badge>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <RotateCcw className="h-3 w-3" />
                        <span>Cliquer pour retourner</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-xl md:text-2xl text-foreground font-medium text-center leading-relaxed max-w-2xl">
                        {currentCard.question}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                      <Brain className="h-4 w-4" />
                      <span>Question {currentIndex + 1} sur {cards.length}</span>
                    </div>
                  </div>
                </div>

                <div className="flip-card-back">
                  <div className="h-full w-full rounded-xl p-8 flex flex-col relative cursor-pointer bg-muted/40 border border-border shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <Badge className={`${currentCard.isTrue ? "bg-emerald-500" : "bg-red-500"} text-white hover:opacity-90`}>
                        {currentCard.isTrue ? "VRAI" : "FAUX"}
                      </Badge>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <RotateCcw className="h-3 w-3" />
                        <span>Cliquer pour retourner</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <p className="text-lg text-foreground leading-relaxed">{currentCard.explanation}</p>
                    </div>
                    {currentCard.interval > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                        <Clock className="h-3 w-3" />
                        <span>Prochaine révision dans {currentCard.interval} jour{currentCard.interval > 1 ? "s" : ""}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-5 gap-2">
        <Button variant="outline" onClick={handleSkip} className="flex flex-col items-center gap-1 h-auto py-3">
          <span className="text-xs">Passer</span>
        </Button>
        <Button onClick={() => handleDifficulty("again")} className="flex flex-col items-center gap-1 h-auto py-3 bg-red-500 hover:bg-red-600 text-white">
          <XCircle className="h-4 w-4" />
          <span className="text-xs font-semibold">Encore</span>
          <span className="text-[10px] opacity-80">&lt; 1 min</span>
        </Button>
        <Button onClick={() => handleDifficulty("hard")} className="flex flex-col items-center gap-1 h-auto py-3 bg-orange-500 hover:bg-orange-600 text-white">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs font-semibold">Difficile</span>
          <span className="text-[10px] opacity-80">5 min</span>
        </Button>
        <Button onClick={() => handleDifficulty("good")} className="flex flex-col items-center gap-1 h-auto py-3 bg-blue-500 hover:bg-blue-600 text-white">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-semibold">Bon</span>
          <span className="text-[10px] opacity-80">10 min</span>
        </Button>
        <Button onClick={() => handleDifficulty("easy")} className="flex flex-col items-center gap-1 h-auto py-3 bg-emerald-500 hover:bg-emerald-600 text-white">
          <Zap className="h-4 w-4" />
          <span className="text-xs font-semibold">Facile</span>
          <span className="text-[10px] opacity-80">25 min</span>
        </Button>
      </div>
    </div>
  );
}

// ====================== MANUAL VIEW (Mon Cahier — dossiers) ======================
function ManualView({ onBack }: { onBack: () => void }) {
  const {
    folders,
    dueErrors,
    filteredErrors,
    setActiveFolder,
    activeFolder,
    updateReview,
    loading,
  } = useMedicalErrorBook();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Comptes par dossier (basés sur dueErrors = cartes à réviser)
  const folderDueCounts = useMemo(() => {
    const map: Record<string, number> = { __none__: 0 };
    for (const f of folders) map[f.id] = 0;
    for (const e of dueErrors) {
      const k = e.folderId ?? "__none__";
      map[k] = (map[k] || 0) + 1;
    }
    return map;
  }, [dueErrors, folders]);

  const folderTotalCounts = useMemo(() => {
    // utilise filteredErrors quand activeFolder = "all", sinon il faut une autre source.
    // Pour avoir le total par dossier on s'appuie sur la requête déjà faite par useMedicalErrorBook
    // qui renvoie filteredErrors filtrés. Comme on n'a pas la liste totale ici facilement,
    // on affiche simplement le compte des cartes dues par dossier.
    return folderDueCounts;
  }, [folderDueCounts]);

  // Quand on sélectionne un dossier, on bascule activeFolder dans le hook pour que dueErrors soit filtré
  useEffect(() => {
    if (selectedFolderId === null) {
      if (activeFolder !== "all") setActiveFolder("all");
    } else {
      setActiveFolder(selectedFolderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolderId]);

  if (loading) return <div className="text-center text-muted-foreground py-20">Chargement...</div>;

  // Niveau 3 : session SRS
  if (selectedFolderId !== null) {
    const folder = folders.find((f) => f.id === selectedFolderId);
    const folderName = selectedFolderId === "__none__" ? "Sans dossier" : folder?.name ?? "Dossier";
    return (
      <ManualFlashcardSession
        cards={dueErrors}
        totalCount={filteredErrors.length}
        folderName={folderName}
        onReview={updateReview}
        onBackToFolders={() => setSelectedFolderId(null)}
      />
    );
  }

  // Niveau 2 : grille de dossiers
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Retour aux catégories
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <PenLine className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Manuelle</h2>
          <p className="text-sm text-muted-foreground">
            Sélectionnez un dossier pour réviser ses cartes
          </p>
        </div>
      </div>

      {folders.length === 0 && (folderDueCounts["__none__"] || 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucun dossier</h3>
          <p className="text-muted-foreground max-w-md">
            Créez d'abord des erreurs dans Mon Cahier pour pouvoir les réviser ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((f) => (
            <motion.button
              key={f.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedFolderId(f.id)}
              className="group relative flex flex-col items-start gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left"
            >
              <div className="h-11 w-11 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <FolderOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="w-full">
                <h3 className="font-semibold text-foreground line-clamp-2 text-sm">{f.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {folderDueCounts[f.id] || 0} à réviser
                </p>
              </div>
            </motion.button>
          ))}
          {(folderDueCounts["__none__"] || 0) > 0 && (
            <motion.button
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedFolderId("__none__")}
              className="group relative flex flex-col items-start gap-3 p-5 rounded-xl border border-dashed border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all text-left"
            >
              <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="w-full">
                <h3 className="font-semibold text-foreground line-clamp-2 text-sm">Sans dossier</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {folderDueCounts["__none__"] || 0} à réviser
                </p>
              </div>
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

// ====================== HUB PRINCIPAL ======================
export default function FlashcardsHubView() {
  const { user } = useAuth();
  const [active, setActive] = useState<SourceKey | null>(null);
  const [autoCounts, setAutoCounts] = useState<Record<string, number>>({ kholle: 0, annale: 0, exam: 0 });
  const [manualCount, setManualCount] = useState(0);

  const loadCounts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("errors")
      .select("source")
      .eq("user_id", user.id)
      .in("source", ["kholle", "annale", "exam", "exam_blanc"])
      .limit(5000);
    const counts: Record<string, number> = { kholle: 0, annale: 0, exam: 0 };
    for (const r of (data ?? []) as { source: string }[]) {
      const s = AUTO_SOURCES.find((src) => src.match.includes(r.source));
      if (s) counts[s.key]++;
    }
    setAutoCounts(counts);

    const { count } = await supabase
      .from("medical_errors")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    setManualCount(count ?? 0);
  };

  useEffect(() => {
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (active === "manual") return <ManualView onBack={() => { setActive(null); loadCounts(); }} />;
  if (active) return <AutoSourceView sourceKey={active} onBack={() => { setActive(null); loadCounts(); }} />;

  // Niveau 1 : 4 blocs
  const allBlocks = [
    ...AUTO_SOURCES.map((s) => ({ ...s, count: autoCounts[s.key] })),
    { ...MANUAL_SOURCE, count: manualCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Flashcards</h2>
        <p className="text-sm text-muted-foreground">Choisissez une catégorie</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {allBlocks.map((b) => {
          const Icon = b.icon;
          return (
            <motion.button
              key={b.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActive(b.key as SourceKey)}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${b.gradient} p-6 text-left transition-all hover:shadow-xl min-h-[180px] flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center shadow-sm">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {b.count} carte{b.count > 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="mt-6">
                <h3 className="text-xl md:text-2xl font-bold text-foreground">{b.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {b.key === "manual" ? "Vos dossiers personnels →" : "Voir les cartes par matière →"}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
