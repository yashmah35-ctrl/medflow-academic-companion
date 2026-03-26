import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

export interface Proposition {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  question: string;
  image_url?: string;
  propositions: Proposition[];
  explanation?: string;
}

interface TrainingEngineProps {
  title: string;
  format: "QCM" | "QIM";
  questions: Question[];
  onFinish: (result: { score: number; total: number; wrong: Question[] }) => void;
  onBack: () => void;
}

export function TrainingEngine({ title, format, questions, onFinish, onBack }: TrainingEngineProps) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, Record<string, string>>>({});
  const [showResults, setShowResults] = useState(false);
  const [finished, setFinished] = useState(false);

  const isQIM = format === "QIM";
  const currentQuestion = questions[currentQIndex];

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

  const computeScore = () => {
    let totalScore = 0;
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
          if (userSaysTrue === p.isCorrect) qScore += 0.2;
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

    return { score: Math.round(totalScore * 100) / 100, total: questions.length, wrong: wrongQuestions };
  };

  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
      setShowResults(false);
    } else {
      setFinished(true);
      onFinish(computeScore());
    }
  };

  if (finished) {
    const { score, total, wrong } = computeScore();
    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">Résultats</h2>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-4xl font-bold text-primary">{score}/{total}</p>
          <Progress value={(score / total) * 100} className="mt-3 h-2.5" />
          <p className="text-sm text-muted-foreground mt-2">
            {wrong.length === 0 ? "Parfait ! 🎉" : `${wrong.length} erreur(s)`}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <Button size="sm" onClick={() => {
            setCurrentQIndex(0);
            setUserAnswers({});
            setShowResults(false);
            setFinished(false);
          }}>
            <Play className="h-4 w-4 mr-1" /> Recommencer
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;
  const answers = userAnswers[currentQuestion.id] || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Badge variant="secondary" className="text-xs">
          {currentQIndex + 1}/{questions.length}
        </Badge>
        <Badge className="text-xs">{format}</Badge>
      </div>

      <Progress value={((currentQIndex + 1) / questions.length) * 100} className="h-1.5" />

      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3">{currentQuestion.question}</h3>
        {currentQuestion.image_url && (
          <img src={currentQuestion.image_url} alt="Énoncé" className="max-h-48 rounded-lg border border-border object-contain mb-3" />
        )}
        <p className="text-[10px] text-muted-foreground mb-3">
          {isQIM ? "Vrai ou Faux pour chaque proposition" : "Sélectionne la/les bonne(s) réponse(s)"}
        </p>

        <div className="space-y-1.5">
          {currentQuestion.propositions.map((p) => {
            const userAnswer = answers[p.id];
            let borderClass = "border-border";
            let bgClass = "bg-card";

            let feedbackText = "";
            let feedbackType: "correct" | "wrong" | "missed" | "" = "";

            if (showResults) {
              if (isQIM) {
                const userSaysTrue = userAnswer === "vrai";
                const userSaysFaux = userAnswer === "faux";
                const hasAnswered = userAnswer === "vrai" || userAnswer === "faux";
                if (hasAnswered && (userSaysTrue === p.isCorrect)) {
                  borderClass = "border-green-500"; bgClass = "bg-green-500/10";
                  feedbackText = "✓ Bonne réponse"; feedbackType = "correct";
                } else if (hasAnswered && (userSaysTrue !== p.isCorrect)) {
                  borderClass = "border-destructive"; bgClass = "bg-destructive/10";
                  feedbackText = p.isCorrect ? "✗ C'est Vrai, pas Faux" : "✗ C'est Faux, pas Vrai";
                  feedbackType = "wrong";
                } else {
                  // Not answered
                  borderClass = "border-amber-500"; bgClass = "bg-amber-500/10";
                  feedbackText = "⚠ Non répondu"; feedbackType = "missed";
                }
              } else {
                const isSelected = userAnswer === "selected";
                if (p.isCorrect && isSelected) {
                  borderClass = "border-green-500"; bgClass = "bg-green-500/10";
                  feedbackText = "✓ Bonne réponse"; feedbackType = "correct";
                } else if (p.isCorrect && !isSelected) {
                  borderClass = "border-amber-500"; bgClass = "bg-amber-500/10";
                  feedbackText = "⚠ Vous auriez dû cocher"; feedbackType = "missed";
                } else if (!p.isCorrect && isSelected) {
                  borderClass = "border-destructive"; bgClass = "bg-destructive/10";
                  feedbackText = "✗ Vous avez coché à tort"; feedbackType = "wrong";
                }
              }
            }

            if (isQIM) {
              return (
                <div key={p.id} className="space-y-0">
                  <div className={`flex items-center gap-2 rounded-lg border p-2.5 transition-all ${borderClass} ${bgClass}`}>
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">{p.id}</span>
                    <span className="flex-1 text-xs text-foreground">{p.text}</span>
                    {!showResults ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant={userAnswer === "vrai" ? "default" : "outline"} className="h-6 px-2 text-[10px]"
                          onClick={() => toggleAnswer(currentQuestion.id, p.id, "vrai")}>V</Button>
                        <Button size="sm" variant={userAnswer === "faux" ? "destructive" : "outline"} className="h-6 px-2 text-[10px]"
                          onClick={() => toggleAnswer(currentQuestion.id, p.id, "faux")}>F</Button>
                      </div>
                    ) : (
                      <Badge variant={p.isCorrect ? "default" : "secondary"} className="text-[10px]">
                        {p.isCorrect ? "✓ V" : "✗ F"}
                      </Badge>
                    )}
                  </div>
                  {showResults && feedbackText && (
                    <div className={`ml-8 mt-0.5 px-3 py-1 text-[10px] font-medium ${
                      feedbackType === "correct" ? "text-green-600" : feedbackType === "wrong" ? "text-destructive" : "text-amber-600"
                    }`}>
                      {feedbackText}
                    </div>
                  )}
                  {showResults && p.explanation && (
                    <div className={`ml-8 mt-0.5 rounded-b-lg border border-t-0 px-3 py-1.5 text-[10px] ${p.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                      <span className={`font-semibold ${p.isCorrect ? "text-green-600" : "text-destructive"}`}>{p.isCorrect ? "VRAI" : "FAUX"}</span>{" "}
                      <span className="text-foreground">{p.explanation}</span>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={p.id} className="space-y-0">
                <button onClick={() => toggleAnswer(currentQuestion.id, p.id)}
                  className={`w-full flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${borderClass} ${bgClass} ${
                    !showResults && userAnswer === "selected" ? "border-primary bg-primary/10" : ""
                  }`}>
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">{p.id}</span>
                  <span className="flex-1 text-xs text-foreground">{p.text}</span>
                  {showResults && (
                    p.isCorrect
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : userAnswer === "selected" ? <XCircle className="h-4 w-4 text-destructive" /> : null
                  )}
                </button>
                {showResults && p.explanation && (
                  <div className={`ml-8 mt-0.5 rounded-b-lg border border-t-0 px-3 py-1.5 text-[10px] ${p.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
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
          <p className="text-xs text-foreground whitespace-pre-wrap">{currentQuestion.explanation}</p>
        </div>
      )}

      <div className="flex justify-end">
        {!showResults ? (
          <Button size="sm" onClick={() => setShowResults(true)}>Valider</Button>
        ) : (
          <Button size="sm" onClick={nextQuestion}>
            {currentQIndex < questions.length - 1 ? "Suivante" : "Résultats"}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
