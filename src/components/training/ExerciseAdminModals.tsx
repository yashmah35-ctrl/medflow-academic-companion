import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { QuestionImageUpload } from "./QuestionImageUpload";
import { supabase } from "@/integrations/supabase/client";
import type { Question, Proposition } from "./TrainingEngine";

interface AdminExercise {
  id: string;
  title: string;
  format: string;
  questions_json: any[] | null;
}

// ─── Add Question Modal ───
export function AddQuestionModal({
  open, onOpenChange, exercise, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exercise: AdminExercise | null;
  onSaved: () => void;
}) {
  const [questionText, setQuestionText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [explanationText, setExplanationText] = useState("");
  const [propositions, setPropositions] = useState<Proposition[]>(defaultProps());

  function defaultProps(): Proposition[] {
    return ["A","B","C","D","E"].map(id => ({ id, text: "", isCorrect: false }));
  }

  const handleSave = async () => {
    if (!exercise || !questionText.trim()) return;
    const filled = propositions.filter(p => p.text.trim());
    if (filled.length < 2) { toast.error("Au moins 2 propositions"); return; }

    const newQ: Question = {
      id: crypto.randomUUID(),
      question: questionText.trim(),
      image_url: imageUrl,
      propositions: filled,
      explanation: explanationText.trim() || undefined,
    };
    const updated = [...(exercise.questions_json || []), newQ];
    const { error } = await supabase.from("admin_exercises").update({ questions_json: updated as any }).eq("id", exercise.id);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Question ajoutée !");
    setQuestionText(""); setImageUrl(undefined); setExplanationText(""); setPropositions(defaultProps());
    onSaved();
    onOpenChange(false);
  };

  const isQIM = exercise?.format === "QIM";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une question</DialogTitle>
          <DialogDescription>Format : {exercise?.format || "QCM"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Énoncé</Label>
            <Input value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Ex: Quelle est la structure..." className="mt-1" />
            <QuestionImageUpload imageUrl={imageUrl} onImageChange={setImageUrl} />
          </div>
          <div>
            <Label>Propositions</Label>
            <div className="mt-2 space-y-2">
              {propositions.map((p, idx) => (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    {isQIM ? (
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
                    <Input value={p.text} onChange={e => { const u = [...propositions]; u[idx] = { ...u[idx], text: e.target.value }; setPropositions(u); }}
                      placeholder={`Proposition ${p.id}`} className="flex-1 h-8 text-sm" />
                  </div>
                  <div className="ml-12">
                    <Input value={p.explanation || ""} onChange={e => { const u = [...propositions]; u[idx] = { ...u[idx], explanation: e.target.value || undefined }; setPropositions(u); }}
                      placeholder={`Explication ${p.id} (optionnel)`} className="h-7 text-xs text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label>Explication (optionnel)</Label>
            <Input value={explanationText} onChange={e => setExplanationText(e.target.value)} placeholder="Explication de la réponse..." className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={!questionText.trim()}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Questions Modal ───
export function EditQuestionsModal({
  open, onOpenChange, exercise, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exercise: AdminExercise | null;
  onSaved: () => void;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | undefined>();
  const [editExplanation, setEditExplanation] = useState("");
  const [editProps, setEditProps] = useState<Proposition[]>([]);

  const questions = (exercise?.questions_json || []) as Question[];
  const isQIM = exercise?.format === "QIM";

  const startEdit = (idx: number) => {
    const q = questions[idx];
    setEditingIdx(idx);
    setEditText(q.question);
    setEditImageUrl(q.image_url);
    setEditExplanation(q.explanation || "");
    setEditProps(["A","B","C","D","E"].map(id => {
      const existing = q.propositions.find(p => p.id === id);
      return existing ? { ...existing } : { id, text: "", isCorrect: false };
    }));
  };

  const handleSaveEdit = async () => {
    if (!exercise || editingIdx === null || !editText.trim()) return;
    const filled = editProps.filter(p => p.text.trim());
    if (filled.length < 2) { toast.error("Au moins 2 propositions"); return; }

    const updated = [...questions];
    updated[editingIdx] = {
      ...updated[editingIdx],
      question: editText.trim(),
      image_url: editImageUrl,
      propositions: filled,
      explanation: editExplanation.trim() || undefined,
    };
    const { error } = await supabase.from("admin_exercises").update({ questions_json: updated as any }).eq("id", exercise.id);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Question modifiée !");
    setEditingIdx(null);
    onSaved();
  };

  const handleDelete = async (idx: number) => {
    if (!exercise || !confirm("Supprimer cette question ?")) return;
    const updated = questions.filter((_, i) => i !== idx);
    const { error } = await supabase.from("admin_exercises").update({ questions_json: updated as any }).eq("id", exercise.id);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Question supprimée");
    if (editingIdx === idx) setEditingIdx(null);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setEditingIdx(null); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier les questions — {exercise?.title}</DialogTitle>
          <DialogDescription>{questions.length} question(s)</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id || idx} className="rounded-lg border border-border p-3 space-y-2">
              {editingIdx === idx ? (
                <div className="space-y-3">
                  <div>
                    <Label>Énoncé</Label>
                    <Input value={editText} onChange={e => setEditText(e.target.value)} className="mt-1" />
                    <QuestionImageUpload imageUrl={editImageUrl} onImageChange={setEditImageUrl} />
                  </div>
                  <div>
                    <Label>Propositions</Label>
                    <div className="mt-2 space-y-2">
                      {editProps.map((p, pidx) => (
                        <div key={p.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                           {isQIM ? (
                             <div className="flex gap-1">
                               <Button type="button" size="sm" variant={p.isCorrect ? "default" : "outline"} className="h-7 px-2 text-xs"
                                 onClick={() => { const u = [...editProps]; u[pidx] = { ...u[pidx], isCorrect: true }; setEditProps(u); }}>V</Button>
                               <Button type="button" size="sm" variant={!p.isCorrect ? "destructive" : "outline"} className="h-7 px-2 text-xs"
                                 onClick={() => { const u = [...editProps]; u[pidx] = { ...u[pidx], isCorrect: false }; setEditProps(u); }}>F</Button>
                             </div>
                           ) : (
                             <input type="checkbox" checked={p.isCorrect}
                               onChange={() => { const u = [...editProps]; u[pidx] = { ...u[pidx], isCorrect: !u[pidx].isCorrect }; setEditProps(u); }}
                               className="h-4 w-4 rounded border-border accent-primary" />
                           )}
                           <span className="text-sm font-medium text-muted-foreground w-6">{p.id}.</span>
                           <Input value={p.text} onChange={e => { const u = [...editProps]; u[pidx] = { ...u[pidx], text: e.target.value }; setEditProps(u); }}
                             className="flex-1 h-8 text-sm" />
                          </div>
                          <div className="ml-12">
                            <Input value={p.explanation || ""} onChange={e => { const u = [...editProps]; u[pidx] = { ...u[pidx], explanation: e.target.value || undefined }; setEditProps(u); }}
                              placeholder={`Explication ${p.id} (optionnel)`} className="h-7 text-xs text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Explication (optionnel)</Label>
                    <Input value={editExplanation} onChange={e => setEditExplanation(e.target.value)} className="mt-1" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit}>Enregistrer</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingIdx(null)}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{idx + 1}. {q.question}</p>
                    {q.image_url && <img src={q.image_url} alt="" className="max-h-20 rounded mt-1" />}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {q.propositions.map(p => (
                        <Badge key={p.id} variant={p.isCorrect ? "default" : "outline"} className="text-[10px]">
                          {p.id}. {p.text.length > 30 ? p.text.slice(0, 30) + "…" : p.text}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(idx)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {questions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune question</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Import Questions Modal ───
export function ImportQuestionsModal({
  open, onOpenChange, exercise, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  exercise: AdminExercise | null;
  onSaved: () => void;
}) {
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File) => {
    if (!exercise) return;
    setImporting(true);
    try {
      const isText = file.type.startsWith("text/") || /\.txt$/i.test(file.name);

      let payload: Record<string, unknown>;
      if (isText) {
        const text = await file.text();
        payload = { fileText: text, format: exercise.format };
      } else {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        payload = { fileBase64: base64, fileMimeType: file.type, format: exercise.format };
      }

      const { data, error } = await supabase.functions.invoke("extract-kholle-questions", {
        body: payload,
      });
      if (error) throw error;

      const extracted: Question[] = (data.questions || []).map((q: any) => ({
        id: crypto.randomUUID(),
        question: q.question,
        propositions: (q.propositions || []).map((p: any) => ({ id: p.id, text: p.text, isCorrect: p.isCorrect })),
      }));

      if (extracted.length === 0) { toast.error("Aucune question détectée"); return; }

      const updated = [...(exercise.questions_json || []), ...extracted];
      await supabase.from("admin_exercises").update({ questions_json: updated as any }).eq("id", exercise.id);
      toast.success(`${extracted.length} question(s) importée(s) !`);
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Erreur d'import");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importer des questions</DialogTitle>
          <DialogDescription>Importez un fichier image ou PDF avec des questions {exercise?.format}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {importing ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyse en cours...</p>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cliquer pour choisir un fichier</p>
              <p className="text-xs text-muted-foreground">Image ou PDF</p>
              <input type="file" className="hidden" accept="image/*,.pdf"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}