import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Layers, Stethoscope, PlusCircle, X, CheckCircle, XCircle,
  Trash2, Eye, EyeOff, GraduationCap, AlertCircle, AlertTriangle,
  CheckCircle2, Zap, Trophy, Clock, Brain, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useMedicalErrorBook,
  SUBJECTS,
  type MedicalError,
  type Difficulty,
} from "@/hooks/useMedicalErrorBook";

// ============== FORMULAIRE D'AJOUT ==============
function ErrorForm({
  onAdd,
}: {
  onAdd: (input: { subject: string; question: string; explanation: string; isTrue: boolean }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isTrue, setIsTrue] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !question.trim() || !explanation.trim()) return;
    onAdd({ subject, question: question.trim(), explanation: explanation.trim(), isTrue });
    setSubject("");
    setQuestion("");
    setExplanation("");
    setIsTrue(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Nouvelle erreur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Ajouter une erreur au cahier
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="subject">Matière</Label>
            <Select value={subject} onValueChange={setSubject} required>
              <SelectTrigger><SelectValue placeholder="Choisir une matière..." /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question / Énoncé</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Le traitement de première intention de la FA est..."
              className="min-h-[80px] resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Explication / Réponse</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Ex: Faux. Le traitement de première intention est..."
              className="min-h-[100px] resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>L'énoncé est-il vrai ou faux ?</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsTrue(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                  isTrue
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/30"
                    : "bg-card border-border text-muted-foreground hover:border-emerald-300"
                }`}
              >
                <CheckCircle className="h-4 w-4" /> Vrai
              </button>
              <button
                type="button"
                onClick={() => setIsTrue(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                  !isTrue
                    ? "bg-red-50 border-red-400 text-red-700 dark:bg-red-950/30"
                    : "bg-card border-border text-muted-foreground hover:border-red-300"
                }`}
              >
                <XCircle className="h-4 w-4" /> Faux
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              <X className="h-4 w-4 mr-1" /> Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!subject || !question.trim() || !explanation.trim()}
            >
              <PlusCircle className="h-4 w-4 mr-1" /> Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============== VUE CAHIER ==============
function ErrorPage({ error, onDelete }: { error: MedicalError; onDelete: (id: string) => void }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-lg overflow-hidden border border-border bg-card shadow-sm"
    >
      <div className="flex flex-col md:flex-row min-h-[280px]">
        {/* Question side */}
        <div className="flex-1 p-6 md:p-8 relative border-b md:border-b-0 md:border-r border-border">
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="text-xs">{error.subject}</Badge>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Question
              </span>
            </div>
            <p className="text-foreground leading-relaxed text-[15px] font-medium">
              {error.question}
            </p>
          </div>
          <div className="absolute bottom-4 left-6 md:left-8 text-[10px] text-muted-foreground">
            Ajouté le {new Date(error.createdAt).toLocaleDateString("fr-FR")}
          </div>
        </div>

        {/* Answer side */}
        <div
          className="flex-1 p-6 md:p-8 relative bg-muted/30 cursor-pointer group"
          onClick={() => setRevealed(!revealed)}
        >
          {!revealed ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Cliquer pour révéler la réponse
              </p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Réponse
                </span>
                <Badge
                  className={`ml-auto text-xs ${
                    error.isTrue
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50"
                      : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50"
                  }`}
                >
                  {error.isTrue ? "VRAI" : "FAUX"}
                </Badge>
              </div>
              <p className="text-foreground leading-relaxed text-[15px]">{error.explanation}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <EyeOff className="h-3 w-3" /> Cliquer pour masquer
              </div>
            </motion.div>
          )}

          <div className="absolute bottom-4 right-6 md:right-8" onClick={(e) => e.stopPropagation()}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Supprimer cette erreur ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. La carte sera définitivement supprimée de votre cahier.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(error.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
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

function NotebookView({
  errors, subjects, activeSubject, setActiveSubject, onDelete,
}: {
  errors: MedicalError[];
  subjects: string[];
  activeSubject: string;
  setActiveSubject: (s: string) => void;
  onDelete: (id: string) => void;
}) {
  if (errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Votre cahier est vide</h3>
        <p className="text-muted-foreground max-w-md">
          Commencez à ajouter vos erreurs pour créer votre propre base de révision personnalisée.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={activeSubject} onValueChange={setActiveSubject}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrer par matière" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Toutes">Toutes les matières</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">
            {errors.length} erreur{errors.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-6">
          {errors.map((error) => (
            <ErrorPage key={error.id} error={error} onDelete={onDelete} />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}

// ============== VUE FLASHCARD ==============
function FlashcardView({
  dueErrors, subjects, activeSubject, setActiveSubject, onReview, totalErrors,
}: {
  dueErrors: MedicalError[];
  subjects: string[];
  activeSubject: string;
  setActiveSubject: (s: string) => void;
  onReview: (id: string, difficulty: Difficulty) => void;
  totalErrors: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  useEffect(() => {
    setCurrentIndex(0);
    setFlipped(false);
  }, [activeSubject, dueErrors.length]);

  const currentCard = dueErrors[currentIndex];
  const progress =
    totalErrors > 0 ? ((totalErrors - dueErrors.length + currentIndex) / totalErrors) * 100 : 0;

  const handleDifficulty = useCallback(
    (difficulty: Difficulty) => {
      if (!currentCard) return;
      onReview(currentCard.id, difficulty);
      setSessionStats((prev) => ({ ...prev, [difficulty]: prev[difficulty] + 1 }));
      setDirection(1);
      setFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setDirection(0);
      }, 250);
    },
    [currentCard, onReview]
  );

  const handleSkip = useCallback(() => {
    if (dueErrors.length === 0) return;
    setDirection(-1);
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % dueErrors.length);
      setDirection(0);
    }, 250);
  }, [dueErrors.length]);

  if (dueErrors.length === 0 || !currentCard) {
    return (
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
          Vous avez terminé toutes les cartes dues pour aujourd'hui. Revenez plus tard pour
          consolider votre mémoire à long terme.
        </p>

        {Object.values(sessionStats).some((v) => v > 0) && (
          <div className="bg-card rounded-xl p-4 border border-border shadow-sm">
            <p className="text-sm font-medium text-foreground mb-3">Session actuelle</p>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-red-500"><XCircle className="h-4 w-4" /> {sessionStats.again}</span>
              <span className="flex items-center gap-1 text-orange-500"><AlertTriangle className="h-4 w-4" /> {sessionStats.hard}</span>
              <span className="flex items-center gap-1 text-blue-500"><CheckCircle2 className="h-4 w-4" /> {sessionStats.good}</span>
              <span className="flex items-center gap-1 text-emerald-500"><Zap className="h-4 w-4" /> {sessionStats.easy}</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <Select value={activeSubject} onValueChange={setActiveSubject}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrer par matière" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Toutes">Toutes les matières</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>{currentIndex + 1} / {dueErrors.length}</span>
          </div>
          <div className="w-32"><Progress value={progress} className="h-2" /></div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="mb-8">
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
                {/* Front */}
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
                      <span>Question {currentIndex + 1} sur {dueErrors.length}</span>
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div className="flip-card-back">
                  <div className="h-full w-full rounded-xl p-8 flex flex-col relative cursor-pointer bg-muted/40 border border-border shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <Badge
                        className={`${
                          currentCard.isTrue ? "bg-emerald-500" : "bg-red-500"
                        } text-white hover:opacity-90`}
                      >
                        {currentCard.isTrue ? "VRAI" : "FAUX"}
                      </Badge>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <RotateCcw className="h-3 w-3" />
                        <span>Cliquer pour retourner</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <p className="text-lg text-foreground leading-relaxed">
                        {currentCard.explanation}
                      </p>
                    </div>
                    {currentCard.interval > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                        <Clock className="h-3 w-3" />
                        <span>
                          Prochaine révision dans {currentCard.interval} jour
                          {currentCard.interval > 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Difficulty buttons */}
      <div className="grid grid-cols-5 gap-2">
        <Button variant="outline" onClick={handleSkip} className="flex flex-col items-center gap-1 h-auto py-3">
          <span className="text-xs">Passer</span>
        </Button>
        <Button
          onClick={() => handleDifficulty("again")}
          className="flex flex-col items-center gap-1 h-auto py-3 bg-red-500 hover:bg-red-600 text-white"
        >
          <XCircle className="h-4 w-4" />
          <span className="text-xs font-semibold">Encore</span>
          <span className="text-[10px] opacity-80">&lt; 1 min</span>
        </Button>
        <Button
          onClick={() => handleDifficulty("hard")}
          className="flex flex-col items-center gap-1 h-auto py-3 bg-orange-500 hover:bg-orange-600 text-white"
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs font-semibold">Difficile</span>
          <span className="text-[10px] opacity-80">1 jour</span>
        </Button>
        <Button
          onClick={() => handleDifficulty("good")}
          className="flex flex-col items-center gap-1 h-auto py-3 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-semibold">Bon</span>
          <span className="text-[10px] opacity-80">
            {Math.max(2, Math.round(currentCard.interval * currentCard.easeFactor))} j
          </span>
        </Button>
        <Button
          onClick={() => handleDifficulty("easy")}
          className="flex flex-col items-center gap-1 h-auto py-3 bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Zap className="h-4 w-4" />
          <span className="text-xs font-semibold">Facile</span>
          <span className="text-[10px] opacity-80">
            {Math.max(4, Math.round(currentCard.interval * currentCard.easeFactor * 1.3))} j
          </span>
        </Button>
      </div>

      {Object.values(sessionStats).some((v) => v > 0) && (
        <div className="mt-6 flex justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" /> {sessionStats.again}</span>
          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-orange-500" /> {sessionStats.hard}</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-blue-500" /> {sessionStats.good}</span>
          <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-emerald-500" /> {sessionStats.easy}</span>
        </div>
      )}
    </div>
  );
}

// ============== PAGE PRINCIPALE ==============
export default function ErrorNotebook() {
  const [mode, setMode] = useState<"notebook" | "flashcard">("notebook");
  const {
    filteredErrors, dueErrors, subjects, activeSubject, setActiveSubject,
    addError, deleteError, updateReview, loading,
  } = useMedicalErrorBook();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground">Cahier d'Erreurs</h1>
              <p className="text-xs text-muted-foreground">Médecine · Révision intelligente</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setMode("notebook")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                mode === "notebook"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Mon Cahier
            </button>
            <button
              onClick={() => setMode("flashcard")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                mode === "flashcard"
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-4 w-4" />
              Flashcards
              {dueErrors.length > 0 && (
                <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                  {dueErrors.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {mode === "notebook" ? "Mon Cahier d'Erreurs" : "Mode Flashcard"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "notebook"
                ? `${filteredErrors.length} erreur${filteredErrors.length > 1 ? "s" : ""} enregistrée${filteredErrors.length > 1 ? "s" : ""}`
                : `${dueErrors.length} carte${dueErrors.length > 1 ? "s" : ""} à réviser aujourd'hui`}
            </p>
          </div>
          <ErrorForm onAdd={addError} />
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Chargement...</div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {mode === "notebook" ? (
                <NotebookView
                  errors={filteredErrors}
                  subjects={subjects}
                  activeSubject={activeSubject}
                  setActiveSubject={setActiveSubject}
                  onDelete={deleteError}
                />
              ) : (
                <FlashcardView
                  dueErrors={dueErrors}
                  subjects={subjects}
                  activeSubject={activeSubject}
                  setActiveSubject={setActiveSubject}
                  onReview={updateReview}
                  totalErrors={filteredErrors.length}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
