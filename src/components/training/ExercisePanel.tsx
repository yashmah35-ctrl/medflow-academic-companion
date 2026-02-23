import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Plus, Trash2, Pencil, Upload, Camera, Loader2, Dumbbell, BookCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TrainingEngine, type Question, type Proposition } from "./TrainingEngine";

interface AdminExercise {
  id: string;
  subject_id: string;
  title: string;
  format: string;
  questions_json: Question[] | null;
  source_label: string | null;
  score_label: string | null;
  created_at: string;
}

interface ChapterReview {
  id: string;
  course_id: string;
  subject_id: string;
  title: string;
  format: string;
  questions_json: Question[] | null;
  created_at: string;
}

interface ExercisePanelProps {
  subjectId: string;
  courseId?: string;
  subjectName: string;
}

export function ExercisePanel({ subjectId, courseId, subjectName }: ExercisePanelProps) {
  const { user, isAdmin } = useAuth();
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [reviews, setReviews] = useState<ChapterReview[]>([]);
  const [training, setTraining] = useState<{ type: "exercise" | "review"; item: AdminExercise | ChapterReview } | null>(null);

  // Admin create state
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFormat, setNewFormat] = useState<"QCM" | "QIM">("QCM");
  const [newSourceLabel, setNewSourceLabel] = useState("");

  // Add question state
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editTarget, setEditTarget] = useState<{ type: "exercise" | "review"; id: string } | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [propositions, setPropositions] = useState<Proposition[]>([
    { id: "A", text: "", isCorrect: false },
    { id: "B", text: "", isCorrect: false },
    { id: "C", text: "", isCorrect: false },
    { id: "D", text: "", isCorrect: false },
    { id: "E", text: "", isCorrect: false },
  ]);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importTarget, setImportTarget] = useState<{ type: "exercise" | "review"; id: string; format: string } | null>(null);

  useEffect(() => {
    fetchExercises();
    if (courseId) fetchReviews();
  }, [subjectId, courseId]);

  const fetchExercises = async () => {
    const { data } = await supabase
      .from("admin_exercises")
      .select("*")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false });
    if (data) setExercises(data.map((e: any) => ({ ...e, questions_json: e.questions_json as Question[] | null })));
  };

  const fetchReviews = async () => {
    if (!courseId) return;
    const { data } = await supabase
      .from("chapter_reviews")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    if (data) setReviews(data.map((r: any) => ({ ...r, questions_json: r.questions_json as Question[] | null })));
  };

  const handleCreateExercise = async () => {
    if (!newTitle.trim() || !user) return;
    const { error } = await supabase.from("admin_exercises").insert({
      subject_id: subjectId,
      title: newTitle.trim(),
      format: newFormat,
      source_label: newSourceLabel.trim() || null,
      created_by: user.id,
      questions_json: [],
    });
    if (error) { toast.error("Erreur"); return; }
    toast.success("Exercice créé !");
    setShowCreateExercise(false);
    setNewTitle("");
    setNewSourceLabel("");
    fetchExercises();
  };

  const handleCreateReview = async () => {
    if (!newTitle.trim() || !user || !courseId) return;
    const { error } = await supabase.from("chapter_reviews").insert({
      course_id: courseId,
      subject_id: subjectId,
      title: newTitle.trim(),
      format: newFormat,
      created_by: user.id,
      questions_json: [],
    });
    if (error) { toast.error("Erreur"); return; }
    toast.success("Révision créée !");
    setShowCreateReview(false);
    setNewTitle("");
    fetchReviews();
  };

  const handleDeleteExercise = async (id: string) => {
    if (!confirm("Supprimer cet exercice ?")) return;
    await supabase.from("admin_exercises").delete().eq("id", id);
    toast.success("Supprimé");
    fetchExercises();
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Supprimer cette révision ?")) return;
    await supabase.from("chapter_reviews").delete().eq("id", id);
    toast.success("Supprimé");
    fetchReviews();
  };

  const openAddQuestion = (type: "exercise" | "review", id: string) => {
    setEditTarget({ type, id });
    setQuestionText("");
    setPropositions([
      { id: "A", text: "", isCorrect: false },
      { id: "B", text: "", isCorrect: false },
      { id: "C", text: "", isCorrect: false },
      { id: "D", text: "", isCorrect: false },
      { id: "E", text: "", isCorrect: false },
    ]);
    setShowAddQuestion(true);
  };

  const getTargetFormat = () => {
    if (!editTarget) return "QCM";
    if (editTarget.type === "exercise") return exercises.find((e) => e.id === editTarget.id)?.format || "QCM";
    return reviews.find((r) => r.id === editTarget.id)?.format || "QCM";
  };

  const handleAddQuestion = async () => {
    if (!editTarget || !questionText.trim()) return;
    const filledProps = propositions.filter((p) => p.text.trim());
    if (filledProps.length < 2) { toast.error("Au moins 2 propositions"); return; }

    const newQ: Question = { id: crypto.randomUUID(), question: questionText.trim(), propositions: filledProps };
    const table = editTarget.type === "exercise" ? "admin_exercises" : "chapter_reviews";
    const items = editTarget.type === "exercise" ? exercises : reviews;
    const item = items.find((i) => i.id === editTarget.id);
    if (!item) return;

    const updated = [...(item.questions_json || []), newQ];
    const { error } = await supabase.from(table).update({ questions_json: updated as any }).eq("id", editTarget.id);
    if (error) { toast.error("Erreur"); return; }

    toast.success("Question ajoutée !");
    setShowAddQuestion(false);
    if (editTarget.type === "exercise") fetchExercises();
    else fetchReviews();
  };

  // Import handler
  const handleFileImport = async (file: File) => {
    if (!importTarget) return;
    setImporting(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("extract-kholle-questions", {
        body: { fileBase64: base64, fileMimeType: file.type, format: importTarget.format },
      });
      if (error) throw error;

      const extracted: Question[] = (data.questions || []).map((q: any) => ({
        id: crypto.randomUUID(),
        question: q.question,
        propositions: (q.propositions || []).map((p: any) => ({ id: p.id, text: p.text, isCorrect: p.isCorrect })),
      }));

      if (extracted.length === 0) { toast.error("Aucune question détectée"); return; }

      const table = importTarget.type === "exercise" ? "admin_exercises" : "chapter_reviews";
      const items = importTarget.type === "exercise" ? exercises : reviews;
      const item = items.find((i) => i.id === importTarget.id);
      if (!item) return;

      const updated = [...(item.questions_json || []), ...extracted];
      await supabase.from(table).update({ questions_json: updated as any }).eq("id", importTarget.id);
      toast.success(`${extracted.length} question(s) importée(s) !`);
      setShowImport(false);
      if (importTarget.type === "exercise") fetchExercises();
      else fetchReviews();
    } catch (e: any) {
      toast.error(e?.message || "Erreur d'import");
    } finally {
      setImporting(false);
    }
  };

  const handleTrainingFinish = async (result: { score: number; total: number; wrong: Question[] }) => {
    if (!training || !user) return;

    // Only save errors to notebook for exercises, NOT for chapter reviews
    if (training.type === "exercise" && result.wrong.length > 0) {
      const exerciseItem = training.item as AdminExercise;
      const isQIM = exerciseItem.format === "QIM";

      const errorInserts = result.wrong.map((q) => ({
        user_id: user.id,
        question: q.question,
        wrong_answer: "Réponse incorrecte",
        correct_answer: q.propositions.filter((p) => p.isCorrect).map((p) => `${p.id}. ${p.text}`).join(", "),
        subject_name: subjectName,
        error_type: "comprehension",
        occurrence_count: 1,
        source: "exercice",
        propositions_json: q.propositions as unknown as any,
      }));

      await supabase.from("errors").insert(errorInserts);
      toast.success(`${result.wrong.length} erreur(s) ajoutée(s) au cahier d'erreurs`);
    }
    // Chapter reviews: no error saving (by design)
  };

  // Training mode
  if (training) {
    const item = training.item;
    const questions = (item.questions_json || []) as Question[];
    return (
      <div className="h-full overflow-y-auto p-4">
        <TrainingEngine
          title={item.title}
          format={item.format as "QCM" | "QIM"}
          questions={questions}
          onFinish={handleTrainingFinish}
          onBack={() => setTraining(null)}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6 p-4">
      {/* Exercises section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
            <Dumbbell className="h-4 w-4 text-destructive" />
          </div>
          <h3 className="font-bold text-foreground text-sm">Exercices</h3>
        </div>

        <div className="space-y-2">
          {exercises.map((ex) => {
            const qCount = ex.questions_json?.length ?? 0;
            return (
              <div key={ex.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{ex.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {ex.source_label && (
                        <Badge variant="outline" className="text-[10px] h-5">{ex.source_label}</Badge>
                      )}
                      {ex.score_label && (
                        <Badge variant="secondary" className="text-[10px] h-5">{ex.score_label}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{qCount} Q</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs gap-1"
                    disabled={qCount === 0}
                    onClick={() => setTraining({ type: "exercise", item: ex })}>
                    <Play className="h-3 w-3" /> Démarrer
                  </Button>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 border-t border-border pt-2">
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1"
                      onClick={() => openAddQuestion("exercise", ex.id)}>
                      <Plus className="h-3 w-3" /> Question
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1"
                      onClick={() => { setImportTarget({ type: "exercise", id: ex.id, format: ex.format }); setShowImport(true); }}>
                      <Upload className="h-3 w-3" /> Import
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-destructive ml-auto"
                      onClick={() => handleDeleteExercise(ex.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {exercises.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Aucun exercice disponible</p>
          )}

          {isAdmin && (
            <Button variant="outline" size="sm" className="w-full text-xs h-8 mt-1"
              onClick={() => { setShowCreateExercise(true); setNewTitle(""); setNewFormat("QCM"); setNewSourceLabel(""); }}>
              <Plus className="h-3 w-3 mr-1" /> Nouvel exercice
            </Button>
          )}
        </div>
      </div>

      {/* Chapter reviews section - only when viewing a course */}
      {courseId && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BookCheck className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-bold text-foreground text-sm">Révisions de chapitre</h3>
          </div>

          <div className="space-y-2">
            {reviews.map((rev) => {
              const qCount = rev.questions_json?.length ?? 0;
              return (
                <div key={rev.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{rev.title}</p>
                      <span className="text-[10px] text-muted-foreground">{qCount} Q • {rev.format}</span>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs gap-1"
                      disabled={qCount === 0}
                      onClick={() => setTraining({ type: "review", item: rev })}>
                      <Play className="h-3 w-3" /> Démarrer
                    </Button>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 border-t border-border pt-2">
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1"
                        onClick={() => openAddQuestion("review", rev.id)}>
                        <Plus className="h-3 w-3" /> Question
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1"
                        onClick={() => { setImportTarget({ type: "review", id: rev.id, format: rev.format }); setShowImport(true); }}>
                        <Upload className="h-3 w-3" /> Import
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-destructive ml-auto"
                        onClick={() => handleDeleteReview(rev.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {reviews.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune révision pour ce chapitre</p>
            )}

            {isAdmin && (
              <Button variant="outline" size="sm" className="w-full text-xs h-8 mt-1"
                onClick={() => { setShowCreateReview(true); setNewTitle(""); setNewFormat("QCM"); }}>
                <Plus className="h-3 w-3 mr-1" /> Nouvelle révision
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Create exercise dialog */}
      <Dialog open={showCreateExercise} onOpenChange={setShowCreateExercise}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel exercice</DialogTitle>
            <DialogDescription>Créer un exercice pour {subjectName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: 3ème Colle de Chimie" className="mt-1" />
            </div>
            <div>
              <Label>Étiquette source (optionnel)</Label>
              <Input value={newSourceLabel} onChange={(e) => setNewSourceLabel(e.target.value)} placeholder="Ex: Entrainement Galien Nantes" className="mt-1" />
            </div>
            <div>
              <Label>Format</Label>
              <RadioGroup value={newFormat} onValueChange={(v) => setNewFormat(v as "QCM" | "QIM")} className="mt-2">
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3 flex-1">
                    <RadioGroupItem value="QCM" id="ex-qcm" />
                    <Label htmlFor="ex-qcm" className="cursor-pointer text-xs">QCM</Label>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3 flex-1">
                    <RadioGroupItem value="QIM" id="ex-qim" />
                    <Label htmlFor="ex-qim" className="cursor-pointer text-xs">QIM</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateExercise(false)}>Annuler</Button>
            <Button onClick={handleCreateExercise} disabled={!newTitle.trim()}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create review dialog */}
      <Dialog open={showCreateReview} onOpenChange={setShowCreateReview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle révision de chapitre</DialogTitle>
            <DialogDescription>Les erreurs ne seront pas ajoutées au cahier d'erreurs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Révision Chapitre 3" className="mt-1" />
            </div>
            <div>
              <Label>Format</Label>
              <RadioGroup value={newFormat} onValueChange={(v) => setNewFormat(v as "QCM" | "QIM")} className="mt-2">
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3 flex-1">
                    <RadioGroupItem value="QCM" id="rev-qcm" />
                    <Label htmlFor="rev-qcm" className="cursor-pointer text-xs">QCM</Label>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3 flex-1">
                    <RadioGroupItem value="QIM" id="rev-qim" />
                    <Label htmlFor="rev-qim" className="cursor-pointer text-xs">QIM</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateReview(false)}>Annuler</Button>
            <Button onClick={handleCreateReview} disabled={!newTitle.trim()}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add question dialog */}
      <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une question</DialogTitle>
            <DialogDescription>Format : {getTargetFormat()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Énoncé</Label>
              <Input value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Ex: Quelle est la structure..." className="mt-1" />
            </div>
            <div>
              <Label>Propositions</Label>
              <div className="mt-2 space-y-2">
                {propositions.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-2">
                    {getTargetFormat() === "QIM" ? (
                      <div className="flex gap-1">
                        <Button type="button" size="sm" variant={p.isCorrect ? "default" : "outline"} className="h-7 px-2 text-xs"
                          onClick={() => { const u = [...propositions]; u[idx] = { ...u[idx], isCorrect: true }; setPropositions(u); }}>V</Button>
                        <Button type="button" size="sm" variant={!p.isCorrect ? "destructive" : "outline"} className="h-7 px-2 text-xs"
                          onClick={() => { const u = [...propositions]; u[idx] = { ...u[idx], isCorrect: false }; setPropositions(u); }}>F</Button>
                      </div>
                    ) : (
                      <input type="checkbox" checked={p.isCorrect}
                        onChange={() => { const u = [...propositions]; u[idx] = { ...u[idx], isCorrect: !u[idx].isCorrect }; setPropositions(u); }}
                        className="h-4 w-4 rounded border-border accent-primary" />
                    )}
                    <span className="text-sm font-medium text-muted-foreground w-6">{p.id}.</span>
                    <Input value={p.text} onChange={(e) => { const u = [...propositions]; u[idx] = { ...u[idx], text: e.target.value }; setPropositions(u); }}
                      placeholder={`Proposition ${p.id}`} className="flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddQuestion(false)}>Annuler</Button>
            <Button onClick={handleAddQuestion}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importer des questions</DialogTitle>
            <DialogDescription>L'IA extraira les questions automatiquement</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Fichier</span>
              <input type="file" className="hidden" accept="image/*,application/pdf" disabled={importing}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileImport(f); e.target.value = ""; }} />
            </label>
            <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <Camera className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Photo</span>
              <input type="file" className="hidden" accept="image/*" capture="environment" disabled={importing}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileImport(f); e.target.value = ""; }} />
            </label>
          </div>
          {importing && (
            <div className="flex items-center gap-3 rounded-lg bg-muted p-4 mt-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Extraction en cours…</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
