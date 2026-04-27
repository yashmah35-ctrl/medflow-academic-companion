import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, FileText, Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrainingEngine, type Question } from "@/components/training/TrainingEngine";
import { toast } from "sonner";

export default function QCMCreator() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);

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
    setLoading(true);
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
      setQuestions(data.questions);
      toast.success(`${data.questions.length} QCM générés !`);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  if (questions) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setQuestions(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <TrainingEngine
          title={title || "QCM générés par IA"}
          format="QCM"
          questions={questions}
          onFinish={() => toast.success("Session terminée !")}
          onBack={() => setQuestions(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Création de QCM
        </h1>
        <p className="text-muted-foreground mt-1">
          Importe un cours en PDF, l'IA génère 20 QCM de 5 propositions pour t'entraîner.
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
          disabled={!file || loading}
          className="w-full gap-2"
          size="lg"
        >
          {loading ? (
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
