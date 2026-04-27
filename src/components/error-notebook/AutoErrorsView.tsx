import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, BookOpen, Eye, EyeOff, Trash2, AlertCircle,
  RefreshCw, Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

const SOURCE_LABELS: Record<string, string> = {
  kholle: "Khôlle",
  annale: "Annale",
  exam: "Examen blanc",
  exam_blanc: "Examen blanc",
};

const SOURCE_COLORS: Record<string, string> = {
  kholle: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  annale: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  exam: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  exam_blanc: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

function ErrorCard({
  err, onDelete,
}: {
  err: AutoError;
  onDelete: (id: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const sourceLabel = SOURCE_LABELS[err.source] ?? err.source;
  const sourceColor = SOURCE_COLORS[err.source] ?? "bg-muted text-foreground";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-lg overflow-hidden border border-border bg-card shadow-sm"
    >
      <div className="flex flex-col md:flex-row min-h-[260px]">
        {/* Question */}
        <div className="flex-1 p-6 md:p-8 relative border-b md:border-b-0 md:border-r border-border">
          <div className="absolute top-4 right-4 flex items-center gap-1.5 flex-wrap justify-end max-w-[60%]">
            <Badge className={`text-[10px] ${sourceColor} border-0`}>
              {sourceLabel}
            </Badge>
            {err.subject_name && (
              <Badge variant="secondary" className="text-xs">{err.subject_name}</Badge>
            )}
            {err.occurrence_count > 1 && (
              <Badge variant="outline" className="text-[10px] gap-1">
                <RefreshCw className="h-3 w-3" /> x{err.occurrence_count}
              </Badge>
            )}
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Question
              </span>
            </div>
            <p className="text-foreground leading-relaxed text-[15px] font-medium">
              {err.question}
            </p>
            {err.wrong_answer && (
              <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                <span className="font-semibold">Votre réponse :</span> {err.wrong_answer}
              </p>
            )}
          </div>
          <div className="absolute bottom-4 left-6 md:left-8 text-[10px] text-muted-foreground">
            Vue le {new Date(err.last_seen).toLocaleDateString("fr-FR")}
          </div>
        </div>

        {/* Réponse */}
        <div
          className="flex-1 p-6 md:p-8 relative bg-muted/30 cursor-pointer group"
          onClick={() => setRevealed(!revealed)}
        >
          {!revealed ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[180px] gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Cliquer pour révéler la bonne réponse
              </p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Bonne réponse
                </span>
              </div>
              <p className="text-foreground leading-relaxed text-[15px] whitespace-pre-wrap">
                {err.correct_answer || "—"}
              </p>
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
                    Supprimer cette erreur ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette erreur sera définitivement retirée de l'historique.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(err.id)}
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

export default function AutoErrorsView() {
  const { user } = useAuth();
  const [errors, setErrors] = useState<AutoError[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const reload = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("errors")
      .select("id, question, wrong_answer, correct_answer, subject_name, source, occurrence_count, created_at, last_seen")
      .eq("user_id", user.id)
      .in("source", ["kholle", "annale", "exam", "exam_blanc"])
      .order("last_seen", { ascending: false })
      .limit(1000);
    if (error) {
      toast.error("Erreur de chargement");
    } else {
      setErrors((data ?? []) as AutoError[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("errors").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible");
      return;
    }
    setErrors((prev) => prev.filter((e) => e.id !== id));
    toast.success("Erreur supprimée");
  };

  const subjects = Array.from(
    new Set(errors.map((e) => e.subject_name).filter(Boolean) as string[])
  );

  const filtered = errors.filter((e) => {
    if (sourceFilter !== "all" && e.source !== sourceFilter && !(sourceFilter === "exam" && e.source === "exam_blanc")) {
      return false;
    }
    if (subjectFilter !== "all" && e.subject_name !== subjectFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="text-center text-muted-foreground py-20">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sources</SelectItem>
              <SelectItem value="kholle">Khôlles</SelectItem>
              <SelectItem value="annale">Annales</SelectItem>
              <SelectItem value="exam">Examens blancs</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Matière" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="gap-1">
            <Layers className="h-3 w-3" />
            {filtered.length} erreur{filtered.length > 1 ? "s" : ""}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={reload} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Actualiser
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Aucune erreur enregistrée
          </h3>
          <p className="text-muted-foreground max-w-md">
            Les erreurs commises lors des Khôlles, Annales et Examens blancs apparaîtront automatiquement ici.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((e) => (
            <ErrorCard key={e.id} err={e} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
