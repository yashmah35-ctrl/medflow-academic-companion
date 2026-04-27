import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, BookOpen, Play, Trash2, ArrowLeft, CheckCircle2, XCircle, ChevronRight, Upload, Camera, Loader2, Pencil, FileText } from "lucide-react";
import { toast } from "sonner";
import { QuestionImageUpload } from "@/components/training/QuestionImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { WEBHOOKS, callWebhook } from "@/lib/webhooks";
import { saveErrorsWithDedup } from "@/lib/saveErrorsWithDedup";
import { PremiumPaywall } from "@/components/PremiumPaywall";
import { SubjectSourceSelector, SubjectSelection } from "@/components/SubjectSourceSelector";

interface Proposition {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

interface Question {
  id: string;
  question: string;
  image_url?: string;
  propositions: Proposition[];
  explanation?: string;
}

interface Exam {
  id: string;
  name: string;
  format: string;
  subject_id: string | null;
  subject_name?: string;
  date: string | null;
  score: number | null;
  questions_json: Question[] | null;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
}

type View = "list" | "detail" | "train";

export default function ExamsBlancs() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState<SubjectSelection | null>(null);
  const [newFormat, setNewFormat] = useState<"QIM" | "QCM">("QCM");

  // Add question dialog
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionImageUrl, setQuestionImageUrl] = useState<string | undefined>();
  const [explanationText, setExplanationText] = useState("");
  const [propositions, setPropositions] = useState<Proposition[]>([
    { id: "A", text: "", isCorrect: false },
    { id: "B", text: "", isCorrect: false },
    { id: "C", text: "", isCorrect: false },
    { id: "D", text: "", isCorrect: false },
    { id: "E", text: "", isCorrect: false },
  ]);

  // Edit question state
  const [showEditQuestion, setShowEditQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editQuestionImageUrl, setEditQuestionImageUrl] = useState<string | undefined>();
  const [editExplanationText, setEditExplanationText] = useState("");
  const [editPropositions, setEditPropositions] = useState<Proposition[]>([]);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);

  // Training state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, string>>>({});
  const [showResults, setShowResults] = useState(false);
  const [trainingFinished, setTrainingFinished] = useState(false);

  useEffect(() => {
    fetchSubjects();
    if (user) fetchExams();
  }, [user]);

  const fetchSubjects = async () => {
    const { data } = await supabase.from("subjects").select("id, name").order("name");
    if (data) setSubjects(data);
  };

  const fetchExams = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("exams")
      .select("*, subjects(name)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) {
      setExams(
        data.map((k: any) => ({
          ...k,
          subject_name: k.subjects?.name ?? "Inconnue",
          questions_json: k.questions_json as Question[] | null,
        }))
      );
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newSubjectId || !user) return;
    const subject = subjects.find((s) => s.id === newSubjectId);
    if (!subject) return;

    const name = `EB — ${subject.name}`;
    const { error } = await supabase.from("exams").insert({
      user_id: user.id,
      name,
      format: newFormat,
      subject_id: newSubjectId,
      date: new Date().toISOString().split("T")[0],
      questions_json: [],
    });

    if (error) {
      toast.error("Erreur lors de la création");
      return;
    }
    toast.success("Examen blanc créé !");
    setShowCreate(false);
    setNewSubjectId("");
    setNewFormat("QCM");
    fetchExams();
  };

  const handleAddQuestion = async () => {
    if (!selectedExam || !questionText.trim()) return;
    const filledProps = propositions.filter((p) => p.text.trim());
    if (filledProps.length < 2) {
      toast.error("Ajoute au moins 2 propositions");
      return;
    }

    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question: questionText.trim(),
      image_url: questionImageUrl,
      propositions: filledProps,
      explanation: explanationText.trim() || undefined,
    };

    const updatedQuestions = [...(selectedExam.questions_json || []), newQuestion];
    const { error } = await supabase
      .from("exams")
      .update({ questions_json: updatedQuestions as any })
      .eq("id", selectedExam.id);

    if (error) {
      toast.error("Erreur lors de l'ajout");
      return;
    }

    setSelectedExam({ ...selectedExam, questions_json: updatedQuestions });
    setShowAddQuestion(false);
    resetQuestionForm();
    toast.success("Question ajoutée !");
    fetchExams();
  };

  const resetQuestionForm = () => {
    setQuestionText("");
    setQuestionImageUrl(undefined);
    setExplanationText("");
    setPropositions([
      { id: "A", text: "", isCorrect: false },
      { id: "B", text: "", isCorrect: false },
      { id: "C", text: "", isCorrect: false },
      { id: "D", text: "", isCorrect: false },
      { id: "E", text: "", isCorrect: false },
    ]);
  };

  const handleDeleteExam = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (!error) {
      toast.success("Examen supprimé");
      fetchExams();
      if (selectedExam?.id === id) {
        setView("list");
        setSelectedExam(null);
      }
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedExam) return;
    const updated = (selectedExam.questions_json || []).filter((q) => q.id !== qId);
    await supabase
      .from("exams")
      .update({ questions_json: updated as any })
      .eq("id", selectedExam.id);
    setSelectedExam({ ...selectedExam, questions_json: updated });
    fetchExams();
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setEditQuestionText(q.question);
    setEditQuestionImageUrl(q.image_url);
    setEditExplanationText(q.explanation || "");
    const allIds = ["A", "B", "C", "D", "E"];
    setEditPropositions(
      allIds.map((id) => {
        const existing = q.propositions.find((p) => p.id === id);
        return existing ? { ...existing } : { id, text: "", isCorrect: false };
      })
    );
    setShowEditQuestion(true);
  };

  const handleEditQuestion = async () => {
    if (!selectedExam || !editingQuestion || !editQuestionText.trim()) return;
    const filledProps = editPropositions.filter((p) => p.text.trim());
    if (filledProps.length < 2) {
      toast.error("Ajoute au moins 2 propositions");
      return;
    }

    const updatedQuestions = (selectedExam.questions_json || []).map((q) =>
      q.id === editingQuestion.id
        ? { ...q, question: editQuestionText.trim(), image_url: editQuestionImageUrl, propositions: filledProps, explanation: editExplanationText.trim() || undefined }
        : q
    );

    const { error } = await supabase
      .from("exams")
      .update({ questions_json: updatedQuestions as any })
      .eq("id", selectedExam.id);

    if (error) {
      toast.error("Erreur lors de la modification");
      return;
    }

    setSelectedExam({ ...selectedExam, questions_json: updatedQuestions });
    setShowEditQuestion(false);
    setEditingQuestion(null);
    toast.success("Question modifiée !");
    fetchExams();
  };

  // --- Import logic ---
  const handleFileImport = async (file: File) => {
    if (!selectedExam || !user) return;
    setImporting(true);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("extract-kholle-questions", {
        body: {
          fileBase64: base64,
          fileMimeType: file.type,
          format: selectedExam.format,
        },
      });

      // Also call OCR webhook
      callWebhook(WEBHOOKS.OCR, {
        user_id: user.id,
        file_type: file.type,
        format: selectedExam.format,
        source: "exam",
      }).catch(() => {});

      if (error) throw error;

      const extractedQuestions: Question[] = (data.questions || []).map((q: any) => ({
        id: crypto.randomUUID(),
        question: q.question,
        propositions: (q.propositions || []).map((p: any) => ({
          id: p.id,
          text: p.text,
          isCorrect: p.isCorrect,
        })),
      }));

      if (extractedQuestions.length === 0) {
        toast.error("Aucune question détectée dans le document");
        return;
      }

      const updatedQuestions = [...(selectedExam.questions_json || []), ...extractedQuestions];
      const { error: updateError } = await supabase
        .from("exams")
        .update({ questions_json: updatedQuestions as any })
        .eq("id", selectedExam.id);

      if (updateError) throw updateError;

      setSelectedExam({ ...selectedExam, questions_json: updatedQuestions });
      toast.success(`${extractedQuestions.length} question(s) importée(s) !`);
      setShowImport(false);
      fetchExams();
    } catch (e: any) {
      console.error("Import error:", e);
      toast.error(e?.message || "Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  };

  // --- Training logic ---
  const startTraining = () => {
    if (!selectedExam?.questions_json?.length) {
      toast.error("Aucune question à réviser");
      return;
    }
    setCurrentQIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setTrainingFinished(false);
    setView("train");
  };

  const currentQuestion = selectedExam?.questions_json?.[currentQIndex];

  const toggleAnswer = (qId: string, propId: string, value?: string) => {
    if (showResults) return;
    setUserAnswers((prev) => {
      const current = prev[qId] || {};
      if (value) {
        const newVal = current[propId] === value ? undefined : value;
        const updated = { ...current };
        if (newVal) updated[propId] = newVal;
        else delete updated[propId];
        return { ...prev, [qId]: updated };
      } else {
        const updated = { ...current };
        if (updated[propId]) delete updated[propId];
        else updated[propId] = "selected";
        return { ...prev, [qId]: updated };
      }
    });
  };

  const validateQuestion = () => {
    setShowResults(true);
  };

  const nextQuestion = async () => {
    const questions = selectedExam!.questions_json!;
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setShowResults(false);
    } else {
      setTrainingFinished(true);
      await saveErrors();
    }
  };

  const computeScore = () => {
    if (!selectedExam?.questions_json) return { score: 0, total: 0, wrong: [] as Question[] };
    const questions = selectedExam.questions_json;
    const isQIM = selectedExam.format === "QIM";
    let totalScore = 0;
    const totalMax = questions.length;
    const wrongQuestions: Question[] = [];

    questions.forEach((q) => {
      const answers = userAnswers[q.id] || {};
      let qScore = 0;
      let hasWrong = false;

      if (isQIM) {
        q.propositions.forEach((p) => {
          const userAnswer = answers[p.id];
          if (!userAnswer) return;
          const userSaysTrue = userAnswer === "vrai";
          if (userSaysTrue === p.isCorrect) {
            qScore += 0.2;
          } else {
            qScore -= 0.2;
            hasWrong = true;
          }
        });
      } else {
        const correctIds = new Set(q.propositions.filter((p) => p.isCorrect).map((p) => p.id));
        const selectedIds = new Set(
          q.propositions.filter((p) => answers[p.id] === "selected").map((p) => p.id)
        );
        const isExactMatch =
          correctIds.size === selectedIds.size &&
          [...correctIds].every((id) => selectedIds.has(id));
        if (isExactMatch) {
          qScore = 1;
        } else {
          qScore = 0;
          if (selectedIds.size > 0) hasWrong = true;
        }
      }

      totalScore += Math.max(0, qScore);
      if (hasWrong) wrongQuestions.push(q);
    });

    return { score: Math.round(totalScore * 100) / 100, total: totalMax, wrong: wrongQuestions };
  };

  const saveErrors = async () => {
    if (!user || !selectedExam) return;
    const { wrong } = computeScore();
    const isQIM = selectedExam.format === "QIM";
    if (wrong.length === 0) return;

    const subjectName = selectedExam.subject_name || "Inconnue";

    const errors = wrong.map((q) => {
      const correctProps = q.propositions.filter((p) => p.isCorrect).map((p) => `${p.id}. ${p.text}`).join(", ");
      const answers = userAnswers[q.id] || {};
      const wrongProps = q.propositions
        .filter((p) => {
          const a = answers[p.id];
          if (isQIM) {
            if (!a) return false;
            return (a === "vrai") !== p.isCorrect;
          }
          return (a === "selected") !== p.isCorrect;
        })
        .map((p) => `${p.id}. ${p.text}`)
        .join(", ");

      return {
        user_id: user.id,
        question: q.question,
        wrong_answer: wrongProps || "Réponse incorrecte",
        correct_answer: correctProps,
        subject_name: subjectName,
        error_type: "comprehension",
        source: "exam",
        propositions_json: q.propositions as unknown as any,
      };
    });

    const { inserted, updated } = await saveErrorsWithDedup(errors);
    const msgs: string[] = [];
    if (inserted > 0) msgs.push(`${inserted} nouvelle(s) erreur(s)`);
    if (updated > 0) msgs.push(`${updated} erreur(s) mise(s) à jour`);
    if (msgs.length > 0) toast.success(msgs.join(", "));
  };

  // --- Renders ---

  if (view === "detail" && selectedExam) {
    const questions = selectedExam.questions_json || [];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setView("list"); setSelectedExam(null); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{selectedExam.name}</h1>
            <p className="text-sm text-muted-foreground">
              {selectedExam.subject_name} • Format {selectedExam.format} • {questions.length} question(s)
            </p>
          </div>
          <Button onClick={startTraining} disabled={questions.length === 0}>
            <Play className="h-4 w-4 mr-2" /> S'entraîner
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddQuestion(true)}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter une question
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" /> Importer / Scanner
          </Button>
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground">Q{i + 1}. {q.question}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.propositions.map((p) => (
                      <Badge key={p.id} variant={p.isCorrect ? "default" : "secondary"} className="text-xs">
                        {p.id}. {p.text} {p.isCorrect ? "✓" : "✗"}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditQuestion(q)}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
          {questions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Aucune question. Clique sur "Ajouter une question" pour commencer.
            </div>
          )}
        </div>

        {/* Add question dialog */}
        <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter une question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Énoncé de la question</Label>
                <Input value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Ex: Quelle est la structure de l'ADN ?" className="mt-1" />
                <QuestionImageUpload imageUrl={questionImageUrl} onImageChange={setQuestionImageUrl} />
              </div>
              <div>
                <Label>{selectedExam?.format === "QIM" ? "Propositions (indique Vrai ou Faux pour chaque)" : "Propositions (coche les réponses correctes)"}</Label>
                <div className="mt-2 space-y-2">
                  {propositions.map((p, idx) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        {selectedExam?.format === "QIM" ? (
                          <div className="flex gap-1">
                            <Button type="button" size="sm" variant={p.isCorrect ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => { const updated = [...propositions]; updated[idx] = { ...updated[idx], isCorrect: true }; setPropositions(updated); }}>V</Button>
                            <Button type="button" size="sm" variant={!p.isCorrect ? "destructive" : "outline"} className="h-7 px-2 text-xs" onClick={() => { const updated = [...propositions]; updated[idx] = { ...updated[idx], isCorrect: false }; setPropositions(updated); }}>F</Button>
                          </div>
                        ) : (
                          <input type="checkbox" checked={p.isCorrect} onChange={() => { const updated = [...propositions]; updated[idx] = { ...updated[idx], isCorrect: !updated[idx].isCorrect }; setPropositions(updated); }} className="h-4 w-4 rounded border-border accent-primary" />
                        )}
                        <span className="text-sm font-medium text-muted-foreground w-6">{p.id}.</span>
                        <Input value={p.text} onChange={(e) => { const updated = [...propositions]; updated[idx] = { ...updated[idx], text: e.target.value }; setPropositions(updated); }} placeholder={`Proposition ${p.id}`} className="flex-1" />
                      </div>
                      <Input value={p.explanation || ""} onChange={(e) => { const updated = [...propositions]; updated[idx] = { ...updated[idx], explanation: e.target.value || undefined }; setPropositions(updated); }} placeholder={`Explication ${p.id} (optionnel)`} className="ml-8 text-xs h-7" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Explication (optionnel)</Label>
                <textarea
                  value={explanationText}
                  onChange={(e) => setExplanationText(e.target.value)}
                  placeholder="Explication de la réponse correcte..."
                  className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddQuestion(false)}>Annuler</Button>
              <Button onClick={handleAddQuestion}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit question dialog */}
        <Dialog open={showEditQuestion} onOpenChange={setShowEditQuestion}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier la question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Énoncé de la question</Label>
                <Input value={editQuestionText} onChange={(e) => setEditQuestionText(e.target.value)} className="mt-1" />
                <QuestionImageUpload imageUrl={editQuestionImageUrl} onImageChange={setEditQuestionImageUrl} />
              </div>
              <div>
                <Label>{selectedExam?.format === "QIM" ? "Propositions (indique Vrai ou Faux pour chaque)" : "Propositions (coche les réponses correctes)"}</Label>
                <div className="mt-2 space-y-2">
                  {editPropositions.map((p, idx) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        {selectedExam?.format === "QIM" ? (
                          <div className="flex gap-1">
                            <Button type="button" size="sm" variant={p.isCorrect ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => { const updated = [...editPropositions]; updated[idx] = { ...updated[idx], isCorrect: true }; setEditPropositions(updated); }}>V</Button>
                            <Button type="button" size="sm" variant={!p.isCorrect ? "destructive" : "outline"} className="h-7 px-2 text-xs" onClick={() => { const updated = [...editPropositions]; updated[idx] = { ...updated[idx], isCorrect: false }; setEditPropositions(updated); }}>F</Button>
                          </div>
                        ) : (
                          <input type="checkbox" checked={p.isCorrect} onChange={() => { const updated = [...editPropositions]; updated[idx] = { ...updated[idx], isCorrect: !updated[idx].isCorrect }; setEditPropositions(updated); }} className="h-4 w-4 rounded border-border accent-primary" />
                        )}
                        <span className="text-sm font-medium text-muted-foreground w-6">{p.id}.</span>
                        <Input value={p.text} onChange={(e) => { const updated = [...editPropositions]; updated[idx] = { ...updated[idx], text: e.target.value }; setEditPropositions(updated); }} placeholder={`Proposition ${p.id}`} className="flex-1" />
                      </div>
                      <Input value={p.explanation || ""} onChange={(e) => { const updated = [...editPropositions]; updated[idx] = { ...updated[idx], explanation: e.target.value || undefined }; setEditPropositions(updated); }} placeholder={`Explication ${p.id} (optionnel)`} className="ml-8 text-xs h-7" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Explication (optionnel)</Label>
                <textarea
                  value={editExplanationText}
                  onChange={(e) => setEditExplanationText(e.target.value)}
                  placeholder="Explication de la réponse correcte..."
                  className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditQuestion(false)}>Annuler</Button>
              <Button onClick={handleEditQuestion}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import dialog */}
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Importer des questions</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Importe un fichier ou prends une photo de ton sujet. L'IA extraira automatiquement les questions.</p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Importer un fichier</span>
                <span className="text-xs text-muted-foreground">PDF, Image</span>
                <input type="file" className="hidden" accept="image/*,application/pdf" disabled={importing} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileImport(file); e.target.value = ""; }} />
              </label>
              <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Prendre une photo</span>
                <span className="text-xs text-muted-foreground">Appareil photo</span>
                <input type="file" className="hidden" accept="image/*" capture="environment" disabled={importing} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileImport(file); e.target.value = ""; }} />
              </label>
            </div>
            {importing && (
              <div className="flex items-center gap-3 rounded-lg bg-muted p-4 mt-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Extraction en cours…</p>
                  <p className="text-xs text-muted-foreground">L'IA analyse le document</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (view === "train" && selectedExam) {
    const questions = selectedExam.questions_json || [];
    const isQIM = selectedExam.format === "QIM";

    if (trainingFinished) {
      const { score, total, wrong } = computeScore();
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Résultats</h1>
            <p className="text-lg text-muted-foreground">{selectedExam.name}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-5xl font-bold text-primary">{score}/{total}</p>
            <Progress value={(score / total) * 100} className="mt-4 h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {wrong.length === 0 ? "Parfait ! 🎉" : `${wrong.length} erreur(s) ajoutée(s) au cahier d'erreurs`}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setView("detail"); setTrainingFinished(false); }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour
            </Button>
            <Button onClick={startTraining}>
              <Play className="h-4 w-4 mr-2" /> Recommencer
            </Button>
          </div>
        </div>
      );
    }

    if (!currentQuestion) return null;
    const answers = userAnswers[currentQuestion.id] || {};

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setView("detail")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Badge variant="secondary">Question {currentQIndex + 1}/{questions.length}</Badge>
          <Badge>{selectedExam.format}</Badge>
        </div>

        <Progress value={((currentQIndex + 1) / questions.length) * 100} className="h-2" />

        <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{currentQuestion.question}</h2>
          {currentQuestion.image_url && (
            <img src={currentQuestion.image_url} alt="Énoncé" className="max-h-48 rounded-lg border border-border object-contain mb-4" />
          )}
          <p className="text-xs text-muted-foreground mb-4">
            {isQIM ? "Pour chaque proposition, indique si c'est Vrai ou Faux" : "Sélectionne la/les bonne(s) réponse(s)"}
          </p>

          <div className="space-y-2">
            {currentQuestion.propositions.map((p) => {
              const userAnswer = answers[p.id];
              let borderClass = "border-border";
              let bgClass = "bg-card";

              if (showResults) {
                if (isQIM) {
                  const isCorrectAnswer = userAnswer ? ((userAnswer === "vrai") === p.isCorrect) : false;
                  if (userAnswer && isCorrectAnswer) { borderClass = "border-green-500"; bgClass = "bg-green-500/10"; }
                  else if (userAnswer && !isCorrectAnswer) { borderClass = "border-destructive"; bgClass = "bg-destructive/10"; }
                } else {
                  if (p.isCorrect) { borderClass = "border-green-500"; bgClass = "bg-green-500/10"; }
                  else if (userAnswer === "selected" && !p.isCorrect) { borderClass = "border-destructive"; bgClass = "bg-destructive/10"; }
                }
              }

              if (isQIM) {
                return (
                  <div key={p.id} className="space-y-0">
                    <div className={`w-full flex items-center gap-3 rounded-lg border p-3 transition-all ${borderClass} ${bgClass}`}>
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground">{p.id}</span>
                      <span className="flex-1 text-sm text-foreground">{p.text}</span>
                      {!showResults ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant={userAnswer === "vrai" ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => toggleAnswer(currentQuestion.id, p.id, "vrai")}>Vrai</Button>
                          <Button size="sm" variant={userAnswer === "faux" ? "destructive" : "outline"} className="h-7 px-2 text-xs" onClick={() => toggleAnswer(currentQuestion.id, p.id, "faux")}>Faux</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {userAnswer ? <Badge variant="outline" className="text-xs">{userAnswer === "vrai" ? "Vrai" : "Faux"}</Badge> : <Badge variant="secondary" className="text-xs">—</Badge>}
                          <Badge variant={p.isCorrect ? "default" : "secondary"} className="text-xs">{p.isCorrect ? "✓ Vrai" : "✗ Faux"}</Badge>
                        </div>
                      )}
                    </div>
                    {showResults && p.explanation && (
                      <div className={`ml-10 mt-0.5 rounded-b-lg border border-t-0 px-3 py-2 text-xs ${p.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                        <span className={`font-semibold ${p.isCorrect ? "text-green-600" : "text-destructive"}`}>{p.isCorrect ? "VRAI" : "FAUX"}</span>{" "}
                        <span className="text-foreground">{p.explanation}</span>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div key={p.id} className="space-y-0">
                  <button onClick={() => toggleAnswer(currentQuestion.id, p.id)} className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${borderClass} ${bgClass} ${!showResults && userAnswer === "selected" ? "border-primary bg-primary/10" : ""}`}>
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground">{p.id}</span>
                    <span className="flex-1 text-sm text-foreground">{p.text}</span>
                    {showResults && (p.isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : userAnswer === "selected" ? <XCircle className="h-5 w-5 text-destructive" /> : null)}
                  </button>
                  {showResults && p.explanation && (
                    <div className={`ml-10 mt-0.5 rounded-b-lg border border-t-0 px-3 py-2 text-xs ${p.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                      <span className={`font-semibold ${p.isCorrect ? "text-green-600" : "text-destructive"}`}>{p.isCorrect ? "VRAI" : "FAUX"}</span>{" "}
                      <span className="text-foreground">{p.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {showResults && currentQuestion.explanation && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-semibold text-primary mb-1">💡 Explication</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="flex justify-end">
          {!showResults ? (
            <Button onClick={validateQuestion}>Valider</Button>
          ) : (
            <Button onClick={nextQuestion}>
              {currentQIndex < questions.length - 1 ? "Suivante" : "Voir les résultats"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // --- List view ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Examens Blancs</h1>
          <p className="text-muted-foreground mt-1">Crée tes examens blancs et entraîne-toi dessus.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter un Examen
        </Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {exams.map((k) => {
            const qCount = (k.questions_json as Question[] | null)?.length ?? 0;
            return (
              <motion.div
                key={k.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => { setSelectedExam(k); setView("detail"); }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{k.name}</h4>
                      <Badge variant="outline" className="text-xs">{k.format}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {k.date} • {qCount} question(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={qCount === 0} onClick={(e) => { e.stopPropagation(); setSelectedExam(k); setView("detail"); setTimeout(() => startTraining(), 100); }}>
                    <Play className="h-3 w-3 mr-1" /> S'entraîner
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteExam(k.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!loading && exams.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Aucun examen blanc pour le moment</p>
            <p className="text-sm mt-1">Clique sur "Ajouter un Examen" pour commencer</p>
          </div>
        )}
      </div>

      {/* Create exam dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel Examen Blanc</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Matière</Label>
              <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choisir une matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <RadioGroup value={newFormat} onValueChange={(v) => setNewFormat(v as "QIM" | "QCM")} className="mt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3 flex-1">
                    <RadioGroupItem value="QCM" id="qcm-exam" />
                    <Label htmlFor="qcm-exam" className="cursor-pointer">
                      <span className="font-medium">QCM</span>
                      <p className="text-xs text-muted-foreground">Sélectionne les bonnes réponses</p>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3 flex-1">
                    <RadioGroupItem value="QIM" id="qim-exam" />
                    <Label htmlFor="qim-exam" className="cursor-pointer">
                      <span className="font-medium">QIM</span>
                      <p className="text-xs text-muted-foreground">Vrai / Faux • −0.2 par erreur</p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={!newSubjectId}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
