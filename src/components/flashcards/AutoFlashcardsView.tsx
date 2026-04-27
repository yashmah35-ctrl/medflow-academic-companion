import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, BookOpen, Eye, EyeOff, Trash2, AlertCircle,
  RefreshCw, Layers, ArrowLeft, FolderOpen, ClipboardList, FlaskConical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

export type AutoSourceKey = "kholle" | "annale" | "exam";

const SOURCES: { key: AutoSourceKey; label: string; icon: any; gradient: string; match: string[] }[] = [
  { key: "kholle", label: "Khôlles", icon: GraduationCap, gradient: "from-blue-500/20 to-blue-600/5 border-blue-500/30", match: ["kholle"] },
  { key: "annale", label: "Annales", icon: ClipboardList, gradient: "from-purple-500/20 to-purple-600/5 border-purple-500/30", match: ["annale"] },
  { key: "exam", label: "Examens blancs", icon: FlaskConical, gradient: "from-amber-500/20 to-amber-600/5 border-amber-500/30", match: ["exam", "exam_blanc"] },
];

function FlashcardItem({ err, onDelete }: { err: AutoError; onDelete: (id: string) => void }) {
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
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Supprimer cette flashcard ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette flashcard sera retirée définitivement.
                  </AlertDialogDescription>
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

interface Props {
  initialSource: AutoSourceKey;
  onBack: () => void;
}

export default function AutoFlashcardsView({ initialSource, onBack }: Props) {
  const { user } = useAuth();
  const [errors, setErrors] = useState<AutoError[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const src = SOURCES.find((s) => s.key === initialSource)!;

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
  }, [user, initialSource]);

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

  // Niveau 3 : flashcards
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
              <FlashcardItem key={e.id} err={e} onDelete={handleDelete} />
            ))}
          </div>
        </AnimatePresence>
      </div>
    );
  }

  // Niveau 2 : matières
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
