import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertTriangle, Layers, PenLine, Upload, Image, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { WEBHOOKS, callWebhook } from "@/lib/webhooks";

type Mode = "select" | "restitution" | "result";

export default function ActiveLearning() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("select");
  const [restitutionText, setRestitutionText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [subjects, setSubjects] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    supabase.from("subjects").select("id, name, icon").then(({ data }) => {
      if (data) setSubjects(data);
    });
  }, []);

  // Fetch courses when subject changes
  useEffect(() => {
    if (!selectedSubject) {
      setCourses([]);
      return;
    }
    const fetchCourses = async () => {
      // Get folders for this subject, then courses for those folders
      const { data: folders } = await supabase
        .from("folders")
        .select("id")
        .eq("subject_id", selectedSubject);
      if (folders && folders.length > 0) {
        const folderIds = folders.map((f) => f.id);
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title")
          .in("folder_id", folderIds);
        setCourses(coursesData || []);
      } else {
        setCourses([]);
      }
    };
    fetchCourses();
  }, [selectedSubject]);

  if (mode === "select") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Apprentissage Actif</h1>
          <p className="text-muted-foreground mt-1">Choisis un mode pour commencer à apprendre.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate("/flashcards")}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
              <Layers className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Flashcards</h3>
            <p className="text-sm text-muted-foreground">
              Révise avec des flashcards style Anki. Importe des fichiers et l'IA génère automatiquement des flashcards pour toi.
            </p>
            <div className="flex gap-2 mt-3">
              <Badge variant="secondary" className="text-xs"><Type className="h-3 w-3 mr-1" />Texte</Badge>
              <Badge variant="secondary" className="text-xs"><Image className="h-3 w-3 mr-1" />Occlusion</Badge>
              <Badge variant="secondary" className="text-xs"><Upload className="h-3 w-3 mr-1" />Import IA</Badge>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => setMode("restitution")}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-warning/10 text-warning mb-4 group-hover:scale-110 transition-transform">
              <PenLine className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Restitution Libre</h3>
            <p className="text-sm text-muted-foreground">
              Choisis une matière et un cours, puis écris tout ce que tu as retenu. Reçois un feedback détaillé de l'IA.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (mode === "restitution") {

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => { setMode("select"); setShowFeedback(false); setRestitutionText(""); setSelectedSubject(""); setSelectedCourse(""); }}>← Retour</Button>
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h3 className="text-lg font-semibold text-foreground">Restitution Libre</h3>
          <p className="text-sm text-muted-foreground">
            Choisis ta matière et ton cours, puis écris tout ce que tu as retenu.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Matière</label>
              <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); setSelectedCourse(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisis une matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Cours</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={!selectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisis un cours" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            placeholder="Écris tout ce que tu as retenu de ce cours..."
            className="min-h-[200px]"
            value={restitutionText}
            onChange={(e) => setRestitutionText(e.target.value)}
            disabled={!selectedCourse}
          />
          <Button onClick={() => {
            // Call Active Learning webhook
            if (user) {
              callWebhook(WEBHOOKS.ACTIVE_LEARNING, {
                user_id: user.id,
                subject_id: selectedSubject,
                course_id: selectedCourse,
                text: restitutionText,
              }).catch(() => {});
            }
            setShowFeedback(true);
          }} disabled={restitutionText.length < 10 || !selectedCourse}>
            Analyser ma restitution
          </Button>

          {showFeedback && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="rounded-lg bg-success/10 border border-success/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="font-medium text-sm text-foreground">Ce que tu maîtrises bien</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Bonne compréhension de la structure générale</li>
                  <li>Les définitions clés sont bien assimilées</li>
                </ul>
              </div>
              <div className="rounded-lg bg-warning/10 border border-warning/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="font-medium text-sm text-foreground">Ce que tu as oublié</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Les mécanismes réactionnels ne sont pas mentionnés</li>
                  <li>Les exemples cliniques manquent</li>
                </ul>
              </div>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-sm text-foreground">Ce que tu confonds</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Confusion entre substrat et coenzyme</li>
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
