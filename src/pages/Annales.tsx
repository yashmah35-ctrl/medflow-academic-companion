import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, Play, Trash2, ArrowLeft, CheckCircle2, XCircle, ChevronRight, Upload, Camera, Loader2, Pencil, Archive, BarChart3, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Proposition {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  question: string;
  propositions: Proposition[];
}

interface Annale {
  id: string;
  name: string | null;
  format: string;
  subject_id: string | null;
  subject_name?: string;
  year: string | null;
  session: string | null;
  city: string | null;
  questions_json: Question[] | null;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
}

interface TopQuestion {
  question: string;
  count: number;
  years: string[];
}

type View = "list" | "detail" | "train";

export default function Annales() {
  const { user } = useAuth();
  const [annales, setAnnales] = useState<Annale[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [selectedAnnale, setSelectedAnnale] = useState<Annale | null>(null);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState("");
  const [newFormat, setNewFormat] = useState<"QIM" | "QCM">("QCM");
  const [newYear, setNewYear] = useState("");
  const [newSession, setNewSession] = useState("");
  const [newCity, setNewCity] = useState("");

  // Add question dialog
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questionText, setQuestionText] = useState("");
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
  const [editPropositions, setEditPropositions] = useState<Proposition[]>([]);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);

  // Training state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, string>>>({});
  const [showResults, setShowResults] = useState(false);
  const [trainingFinished, setTrainingFinished] = useState(false);

  // Top questions filter
  const [topQuestionsSubject, setTopQuestionsSubject] = useState<string>("all");
  const [topQuestionsSearch, setTopQuestionsSearch] = useState("");

  useEffect(() => {
    fetchSubjects();
    if (user) fetchAnnales();
  }, [user]);

  const fetchSubjects = async () => {
    const { data } = await supabase.from("subjects").select("id, name").order("name");
    if (data) setSubjects(data);
  };

  const fetchAnnales = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("annales")
      .select("*, subjects(name)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) {
      setAnnales(
        data.map((k: any) => ({
          ...k,
          subject_name: k.subjects?.name ?? "Inconnue",
          questions_json: k.questions_json as Question[] | null,
        }))
      );
    }
    setLoading(false);
  };

  // Compute "Questions les plus tombées" across all annales
  const topQuestions = useMemo(() => {
    const questionMap: Record<string, { count: number; years: Set<string>; subjectId: string | null }> = {};

    const filteredAnnales = topQuestionsSubject === "all"
      ? annales
      : annales.filter((a) => a.subject_id === topQuestionsSubject);

    filteredAnnales.forEach((a) => {
      if (!a.questions_json) return;
      a.questions_json.forEach((q) => {
        const key = q.question.trim().toLowerCase();
        if (!questionMap[key]) {
          questionMap[key] = { count: 0, years: new Set(), subjectId: a.subject_id };
        }
        questionMap[key].count++;
        if (a.year) questionMap[key].years.add(a.year);
      });
    });

    let result: TopQuestion[] = Object.entries(questionMap)
      .map(([question, data]) => ({
        question: question.charAt(0).toUpperCase() + question.slice(1),
        count: data.count,
        years: Array.from(data.years).sort(),
      }))
      .sort((a, b) => b.count - a.count);

    if (topQuestionsSearch) {
      const search = topQuestionsSearch.toLowerCase();
      result = result.filter((q) => q.question.toLowerCase().includes(search));
    }

    return result.slice(0, 15);
  }, [annales, topQuestionsSubject, topQuestionsSearch]);

  const handleCreate = async () => {
    if (!newSubjectId || !user) return;
    const subject = subjects.find((s) => s.id === newSubjectId);
    if (!subject) return;

    const name = `Annale — ${subject.name}`;
    const { error } = await supabase.from("annales").insert({
      user_id: user.id,
      name,
      format: newFormat,
      subject_id: newSubjectId,
      year: newYear || null,
      session: newSession || null,
      city: newCity || null,
      questions_json: [],
    });

    if (error) {
      toast.error("Erreur lors de la création");
      return;
    }
    toast.success("Annale créée !");
    setShowCreate(false);
    setNewSubjectId("");
    setNewFormat("QCM");
    setNewYear("");
    setNewSession("");
    setNewCity("");
    fetchAnnales();
  };

  const handleAddQuestion = async () => {
    if (!selectedAnnale || !questionText.trim()) return;
    const filledProps = propositions.filter((p) => p.text.trim());
    if (filledProps.length < 2) {
      toast.error("Ajoute au moins 2 propositions");
      return;
    }

    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question: questionText.trim(),
      propositions: filledProps,
    };

    const updatedQuestions = [...(selectedAnnale.questions_json || []), newQuestion];
    const { error } = await supabase
      .from("annales")
      .update({ questions_json: updatedQuestions as any })
      .eq("id", selectedAnnale.id);

    if (error) {
      toast.error("Erreur lors de l'ajout");
      return;
    }

    setSelectedAnnale({ ...selectedAnnale, questions_json: updatedQuestions });
    setShowAddQuestion(false);
    resetQuestionForm();
    toast.success("Question ajoutée !");
    fetchAnnales();
  };

  const resetQuestionForm = () => {
    setQuestionText("");
    setPropositions([
      { id: "A", text: "", isCorrect: false },
      { id: "B", text: "", isCorrect: false },
      { id: "C", text: "", isCorrect: false },
      { id: "D", text: "", isCorrect: false },
      { id: "E", text: "", isCorrect: false },
    ]);
  };

  const handleDeleteAnnale = async (id: string) => {
    const { error } = await supabase.from("annales").delete().eq("id", id);
    if (!error) {
      toast.success("Annale supprimée");
      fetchAnnales();
      if (selectedAnnale?.id === id) {
        setView("list");
        setSelectedAnnale(null);
      }
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedAnnale) return;
    const updated = (selectedAnnale.questions_json || []).filter((q) => q.id !== qId);
    await supabase
      .from("annales")
      .update({ questions_json: updated as any })
      .eq("id", selectedAnnale.id);
    setSelectedAnnale({ ...selectedAnnale, questions_json: updated });
    fetchAnnales();
  };

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setEditQuestionText(q.question);
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
    if (!selectedAnnale || !editingQuestion || !editQuestionText.trim()) return;
    const filledProps = editPropositions.filter((p) => p.text.trim());
    if (filledProps.length < 2) {
      toast.error("Ajoute au moins 2 propositions");
      return;
    }

    const updatedQuestions = (selectedAnnale.questions_json || []).map((q) =>
      q.id === editingQuestion.id
        ? { ...q, question: editQuestionText.trim(), propositions: filledProps }
        : q
    );

    const { error } = await supabase
      .from("annales")
      .update({ questions_json: updatedQuestions as any })
      .eq("id", selectedAnnale.id);

    if (error) {
      toast.error("Erreur lors de la modification");
      return;
    }

    setSelectedAnnale({ ...selectedAnnale, questions_json: updatedQuestions });
    setShowEditQuestion(false);
    setEditingQuestion(null);
    toast.success("Question modifiée !");
    fetchAnnales();
  };

  const handleFileImport = async (file: File) => {
    if (!selectedAnnale || !user) return;
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
          format: selectedAnnale.format,
        },
      });

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

      const updatedQuestions = [...(selectedAnnale.questions_json || []), ...extractedQuestions];
      const { error: updateError } = await supabase
        .from("annales")
        .update({ questions_json: updatedQuestions as any })
        .eq("id", selectedAnnale.id);

      if (updateError) throw updateError;

      setSelectedAnnale({ ...selectedAnnale, questions_json: updatedQuestions });
      toast.success(`${extractedQuestions.length} question(s) importée(s) !`);
      setShowImport(false);
      fetchAnnales();
    } catch (e: any) {
      console.error("Import error:", e);
      toast.error(e?.message || "Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  };

  const startTraining = () => {
    if (!selectedAnnale?.questions_json?.length) {
      toast.error("Aucune question à réviser");
      return;
    }
    setCurrentQIndex(0);
    setUserAnswers({});
    setShowResults(false);
    setTrainingFinished(false);
    setView("train");
  };

  const currentQuestion = selectedAnnale?.questions_json?.[currentQIndex];

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

  const validateQuestion = () => setShowResults(true);

  const nextQuestion = async () => {
    const questions = selectedAnnale!.questions_json!;
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setShowResults(false);
    } else {
      setTrainingFinished(true);
      await saveErrors();
    }
  };

  const computeScore = () => {
    if (!selectedAnnale?.questions_json) return { score: 0, total: 0, wrong: [] as Question[] };
    const questions = selectedAnnale.questions_json;
    const isQIM = selectedAnnale.format === "QIM";
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
          if ((userAnswer === "vrai") === p.isCorrect) qScore += 0.2;
          else { qScore -= 0.2; hasWrong = true; }
        });
      } else {
        const correctIds = new Set(q.propositions.filter((p) => p.isCorrect).map((p) => p.id));
        const selectedIds = new Set(q.propositions.filter((p) => answers[p.id] === "selected").map((p) => p.id));
        const isExactMatch = correctIds.size === selectedIds.size && [...correctIds].every((id) => selectedIds.has(id));
        if (isExactMatch) qScore = 1;
        else { qScore = 0; if (selectedIds.size > 0) hasWrong = true; }
      }

      totalScore += Math.max(0, qScore);
      if (hasWrong) wrongQuestions.push(q);
    });

    return { score: Math.round(totalScore * 100) / 100, total: totalMax, wrong: wrongQuestions };
  };

  const saveErrors = async () => {
    if (!user || !selectedAnnale) return;
    const { wrong } = computeScore();
    const isQIM = selectedAnnale.format === "QIM";
    if (wrong.length === 0) return;

    const subjectName = selectedAnnale.subject_name || "Inconnue";

    const errorInserts = wrong.map((q) => {
      const correctProps = q.propositions.filter((p) => p.isCorrect).map((p) => `${p.id}. ${p.text}`).join(", ");
      const answers = userAnswers[q.id] || {};
      const wrongProps = q.propositions
        .filter((p) => {
          const a = answers[p.id];
          if (isQIM) { if (!a) return false; return (a === "vrai") !== p.isCorrect; }
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
        occurrence_count: 1,
        source: "annale",
      };
    });

    const { error } = await supabase.from("errors").insert(errorInserts);
    if (!error) {
      toast.success(`${wrong.length} erreur(s) ajoutée(s) au cahier d'erreurs`);
    }
  };

  // --- Detail view ---
  if (view === "detail" && selectedAnnale) {
    const questions = selectedAnnale.questions_json || [];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setView("list"); setSelectedAnnale(null); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{selectedAnnale.name}</h1>
            <p className="text-sm text-muted-foreground">
              {selectedAnnale.subject_name} • {selectedAnnale.format}
              {selectedAnnale.year && ` • ${selectedAnnale.year}`}
              {selectedAnnale.session && ` • Session ${selectedAnnale.session}`}
              {selectedAnnale.city && ` • ${selectedAnnale.city}`}
              {` • ${questions.length} question(s)`}
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
            <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-4">
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
                  <Button variant="ghost" size="icon" onClick={() => openEditQuestion(q)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </motion.div>
          ))}
          {questions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Aucune question. Clique sur "Ajouter une question" pour commencer.</div>
          )}
        </div>

        {/* Add question dialog */}
        <Dialog open={showAddQuestion} onOpenChange={setShowAddQuestion}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Ajouter une question</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Énoncé de la question</Label>
                <Input value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Ex: Quelle est la structure de l'ADN ?" className="mt-1" />
              </div>
              <div>
                <Label>{selectedAnnale?.format === "QIM" ? "Propositions (indique Vrai ou Faux)" : "Propositions (coche les réponses correctes)"}</Label>
                <div className="mt-2 space-y-2">
                  {propositions.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2">
                      {selectedAnnale?.format === "QIM" ? (
                        <div className="flex gap-1">
                          <Button type="button" size="sm" variant={p.isCorrect ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => { const u = [...propositions]; u[idx] = { ...u[idx], isCorrect: true }; setPropositions(u); }}>V</Button>
                          <Button type="button" size="sm" variant={!p.isCorrect ? "destructive" : "outline"} className="h-7 px-2 text-xs" onClick={() => { const u = [...propositions]; u[idx] = { ...u[idx], isCorrect: false }; setPropositions(u); }}>F</Button>
                        </div>
                      ) : (
                        <input type="checkbox" checked={p.isCorrect} onChange={() => { const u = [...propositions]; u[idx] = { ...u[idx], isCorrect: !u[idx].isCorrect }; setPropositions(u); }} className="h-4 w-4 rounded border-border accent-primary" />
                      )}
                      <span className="text-sm font-medium text-muted-foreground w-6">{p.id}.</span>
                      <Input value={p.text} onChange={(e) => { const u = [...propositions]; u[idx] = { ...u[idx], text: e.target.value }; setPropositions(u); }} placeholder={`Proposition ${p.id}`} className="flex-1" />
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

        {/* Edit question dialog */}
        <Dialog open={showEditQuestion} onOpenChange={setShowEditQuestion}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Modifier la question</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Énoncé de la question</Label>
                <Input value={editQuestionText} onChange={(e) => setEditQuestionText(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>{selectedAnnale?.format === "QIM" ? "Propositions (Vrai ou Faux)" : "Propositions (coche les bonnes)"}</Label>
                <div className="mt-2 space-y-2">
                  {editPropositions.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2">
                      {selectedAnnale?.format === "QIM" ? (
                        <div className="flex gap-1">
                          <Button type="button" size="sm" variant={p.isCorrect ? "default" : "outline"} className="h-7 px-2 text-xs" onClick={() => { const u = [...editPropositions]; u[idx] = { ...u[idx], isCorrect: true }; setEditPropositions(u); }}>V</Button>
                          <Button type="button" size="sm" variant={!p.isCorrect ? "destructive" : "outline"} className="h-7 px-2 text-xs" onClick={() => { const u = [...editPropositions]; u[idx] = { ...u[idx], isCorrect: false }; setEditPropositions(u); }}>F</Button>
                        </div>
                      ) : (
                        <input type="checkbox" checked={p.isCorrect} onChange={() => { const u = [...editPropositions]; u[idx] = { ...u[idx], isCorrect: !u[idx].isCorrect }; setEditPropositions(u); }} className="h-4 w-4 rounded border-border accent-primary" />
                      )}
                      <span className="text-sm font-medium text-muted-foreground w-6">{p.id}.</span>
                      <Input value={p.text} onChange={(e) => { const u = [...editPropositions]; u[idx] = { ...u[idx], text: e.target.value }; setEditPropositions(u); }} placeholder={`Proposition ${p.id}`} className="flex-1" />
                    </div>
                  ))}
                </div>
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
            <DialogHeader><DialogTitle>Importer des questions</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Importe un fichier ou prends une photo. L'IA extraira les questions automatiquement.</p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Importer</span>
                <span className="text-xs text-muted-foreground">PDF, Image</span>
                <input type="file" className="hidden" accept="image/*,application/pdf" disabled={importing} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileImport(f); e.target.value = ""; }} />
              </label>
              <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                <Camera className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Photo</span>
                <span className="text-xs text-muted-foreground">Appareil photo</span>
                <input type="file" className="hidden" accept="image/*" capture="environment" disabled={importing} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileImport(f); e.target.value = ""; }} />
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

  // --- Training view ---
  if (view === "train" && selectedAnnale) {
    const questions = selectedAnnale.questions_json || [];
    const isQIM = selectedAnnale.format === "QIM";

    if (trainingFinished) {
      const { score, total, wrong } = computeScore();
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Résultats</h1>
            <p className="text-lg text-muted-foreground">{selectedAnnale.name}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-5xl font-bold text-primary">{score}/{total}</p>
            <Progress value={(score / total) * 100} className="mt-4 h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {wrong.length === 0 ? "Parfait ! 🎉" : `${wrong.length} erreur(s) ajoutée(s) au cahier d'erreurs`}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setView("detail"); setTrainingFinished(false); }}><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Button>
            <Button onClick={startTraining}><Play className="h-4 w-4 mr-2" /> Recommencer</Button>
          </div>
        </div>
      );
    }

    if (!currentQuestion) return null;
    const answers = userAnswers[currentQuestion.id] || {};

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setView("detail")}><ArrowLeft className="h-5 w-5" /></Button>
          <Badge variant="secondary">Question {currentQIndex + 1}/{questions.length}</Badge>
          <Badge>{selectedAnnale.format}</Badge>
        </div>
        <Progress value={((currentQIndex + 1) / questions.length) * 100} className="h-2" />
        <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{currentQuestion.question}</h2>
          <p className="text-xs text-muted-foreground mb-4">{isQIM ? "Vrai ou Faux pour chaque proposition" : "Sélectionne la/les bonne(s) réponse(s)"}</p>
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
                  <div key={p.id} className={`w-full flex items-center gap-3 rounded-lg border p-3 transition-all ${borderClass} ${bgClass}`}>
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
                );
              }

              return (
                <button key={p.id} onClick={() => toggleAnswer(currentQuestion.id, p.id)} className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${borderClass} ${bgClass} ${!showResults && userAnswer === "selected" ? "border-primary bg-primary/10" : ""}`}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground">{p.id}</span>
                  <span className="flex-1 text-sm text-foreground">{p.text}</span>
                  {showResults && (p.isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : userAnswer === "selected" ? <XCircle className="h-5 w-5 text-destructive" /> : null)}
                </button>
              );
            })}
          </div>
        </motion.div>
        <div className="flex justify-end">
          {!showResults ? <Button onClick={validateQuestion}>Valider</Button> : (
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
          <h1 className="text-2xl font-bold text-foreground">Annales</h1>
          <p className="text-muted-foreground mt-1">Analyse les sujets des années passées et entraîne-toi.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter une Annale
        </Button>
      </div>

      {/* Questions les plus tombées */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Questions les plus tombées</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Select value={topQuestionsSubject} onValueChange={setTopQuestionsSubject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toutes les matières" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher une question…" className="pl-9" value={topQuestionsSearch} onChange={(e) => setTopQuestionsSearch(e.target.value)} />
          </div>
        </div>
        <div className="space-y-3">
          {topQuestions.length > 0 ? topQuestions.map((t, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm font-bold text-muted-foreground w-6 shrink-0">#{i + 1}</span>
                <span className="text-sm text-foreground truncate">{t.question}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex gap-1 flex-wrap">
                  {t.years.map((y) => (
                    <Badge key={y} variant="secondary" className="text-xs">{y}</Badge>
                  ))}
                </div>
                <span className="text-xs font-semibold text-primary">{t.count}×</span>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ajoute des annales avec des questions pour voir les tendances.
            </p>
          )}
        </div>
      </div>

      {/* Annales list */}
      <div className="space-y-3">
        <AnimatePresence>
          {annales.map((a) => {
            const qCount = (a.questions_json as Question[] | null)?.length ?? 0;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => { setSelectedAnnale(a); setView("detail"); }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Archive className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{a.name || `Annale — ${a.subject_name}`}</h4>
                      <Badge variant="outline" className="text-xs">{a.format}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.year && `${a.year} `}
                      {a.session && `• Session ${a.session} `}
                      {a.city && `• ${a.city} `}
                      • {qCount} question(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={qCount === 0} onClick={(e) => { e.stopPropagation(); setSelectedAnnale(a); setView("detail"); setTimeout(() => startTraining(), 100); }}>
                    <Play className="h-3 w-3 mr-1" /> S'entraîner
                  </Button>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteAnnale(a.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!loading && annales.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Aucune annale pour le moment</p>
            <p className="text-sm mt-1">Clique sur "Ajouter une Annale" pour commencer</p>
          </div>
        )}
      </div>

      {/* Create annale dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle Annale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Matière</Label>
              <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choisir une matière" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Année</Label>
                <Input value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="Ex: 2023-2024" className="mt-1" />
              </div>
              <div>
                <Label>Session</Label>
                <Input value={newSession} onChange={(e) => setNewSession(e.target.value)} placeholder="Ex: S1" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Ville</Label>
              <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Ex: Paris, Lyon, Montpellier…" className="mt-1" />
            </div>
            <div>
              <Label>Format</Label>
              <RadioGroup value={newFormat} onValueChange={(v) => setNewFormat(v as "QIM" | "QCM")} className="mt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3 flex-1">
                    <RadioGroupItem value="QCM" id="qcm-annale" />
                    <Label htmlFor="qcm-annale" className="cursor-pointer">
                      <span className="font-medium">QCM</span>
                      <p className="text-xs text-muted-foreground">Sélectionne les bonnes réponses</p>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3 flex-1">
                    <RadioGroupItem value="QIM" id="qim-annale" />
                    <Label htmlFor="qim-annale" className="cursor-pointer">
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
