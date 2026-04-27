import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Loader2,
  FileText,
  Sparkles,
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type Question } from "@/components/training/TrainingEngine";
import { QCMTutoratView } from "@/components/qcm/QCMTutoratView";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SavedSession {
  id: string;
  title: string;
  questions_json: Question[];
  source_filename: string | null;
  created_at: string;
}

type View = "list" | "create" | "session";

export default function QCMCreator() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<View>("list");
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Création
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);

  // Session active
  const [active, setActive] = useState<SavedSession | null>(null);

  // Suppression
  const [toDelete, setToDelete] = useState<SavedSession | null>(null);

  const loadSessions = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from("qcm_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Impossible de charger tes QCM");
    } else {
      setSessions((data || []) as any);
    }
    setLoadingList(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 20 Mo)");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  const handleGenerate = async () => {
    if (!file) {
      toast.error("Importe un fichier PDF d'abord");
      return;
    }
    setGenerating(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("generate-qcm", {
        body: {
          fileBase64,
          fileMimeType: file.type || "application/pdf",
          subject: title,
          questionCount: 20,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.questions?.length) throw new Error("Aucune question générée");

      // Sauvegarde Cloud
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Utilisateur non connecté");

      const { data: saved, error: saveErr } = await supabase
        .from("qcm_sessions")
        .insert({
          user_id: userData.user.id,
          title: title || "QCM sans titre",
          questions_json: data.questions,
          source_filename: file.name,
        })
        .select()
        .single();

      if (saveErr) throw saveErr;

      toast.success(`${data.questions.length} QCM générés et sauvegardés !`);
      setActive(saved as any);
      setView("session");
      setFile(null);
      setTitle("");
      loadSessions();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase
      .from("qcm_sessions")
      .delete()
      .eq("id", toDelete.id);
    if (error) {
      toast.error("Échec de la suppression");
    } else {
      toast.success("QCM supprimé");
      setSessions((s) => s.filter((x) => x.id !== toDelete.id));
    }
    setToDelete(null);
  };

  // ---- Vue Session active ----
  if (view === "session" && active) {
    return (
      <QCMTutoratView
        title={active.title}
        questions={active.questions_json}
        onBack={() => {
          setActive(null);
          setView("list");
        }}
        onFinish={({ correct, total }) =>
          toast.success(`Session terminée : ${correct}/${total}`)
        }
      />
    );
  }

  // ---- Vue Création ----
  if (view === "create") {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => setView("list")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>

        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Nouveau QCM
          </h1>
          <p className="text-muted-foreground mt-1">
            Importe un cours en PDF, l'IA génère 20 QCM de 5 propositions.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-6 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la session</Label>
            <Input
              id="title"
              placeholder="Ex : Biophysique - Chapitre 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Cours (PDF)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg p-8 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-3 text-center"
            >
              {file ? (
                <>
                  <FileText className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} Mo · Cliquer pour changer
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Importer un PDF</p>
                    <p className="text-xs text-muted-foreground">Max 20 Mo</p>
                  </div>
                </>
              )}
            </button>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!file || generating}
            className="w-full gap-2"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération en cours... (peut prendre 30s)
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Générer 20 QCM
              </>
            )}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ---- Vue Liste (par défaut) ----
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Création de QCM
          </h1>
          <p className="text-muted-foreground mt-1">
            Tes sessions QCM générées par IA, sauvegardées dans le cloud.
          </p>
        </div>
        <Button onClick={() => setView("create")} className="gap-2">
          <Plus className="h-4 w-4" /> Nouveau QCM
        </Button>
      </div>

      {loadingList ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">Aucun QCM pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Importe un PDF et laisse l'IA générer tes QCM d'entraînement.
          </p>
          <Button onClick={() => setView("create")}>
            <Plus className="h-4 w-4 mr-2" /> Créer mon premier QCM
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sessions.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-foreground line-clamp-2">
                  {s.title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => setToDelete(s)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {s.questions_json?.length || 0} questions ·{" "}
                {new Date(s.created_at).toLocaleDateString("fr-FR")}
              </p>
              <Button
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  setActive(s);
                  setView("session");
                }}
              >
                <Play className="h-3.5 w-3.5" /> Lancer
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce QCM ?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
