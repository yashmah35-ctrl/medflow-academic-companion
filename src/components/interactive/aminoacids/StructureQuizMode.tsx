import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { AMINO_ACIDS, CATEGORY_COLORS, type AminoAcid } from "@/data/aminoAcids";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateChoices(correct: AminoAcid): AminoAcid[] {
  const others = AMINO_ACIDS.filter((a) => a.code1 !== correct.code1);
  const wrong = shuffle(others).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

export default function StructureQuizMode() {
  const questions = useMemo(() => shuffle([...AMINO_ACIDS]), []);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [choices, setChoices] = useState(() => generateChoices(questions[0]));
  const [finished, setFinished] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<{ question: AminoAcid; chosen: string }[]>([]);

  const current = questions[qIndex];
  const isCorrect = selected === current.code1;

  const handleSelect = (code1: string) => {
    if (selected) return;
    setSelected(code1);
    if (code1 === current.code1) setScore((s) => s + 1);
    else setWrongAnswers((w) => [...w, { question: current, chosen: code1 }]);
  };

  const handleNext = useCallback(() => {
    const next = qIndex + 1;
    if (next >= questions.length) {
      setFinished(true);
      return;
    }
    setQIndex(next);
    setSelected(null);
    setChoices(generateChoices(questions[next]));
  }, [qIndex, questions]);

  const restart = () => {
    const newQ = shuffle([...AMINO_ACIDS]);
    questions.splice(0, questions.length, ...newQ);
    setQIndex(0);
    setScore(0);
    setSelected(null);
    setChoices(generateChoices(newQ[0]));
    setFinished(false);
    setWrongAnswers([]);
  };

  if (finished) {
    const pct = Math.round((score / AMINO_ACIDS.length) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-6xl">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "📚"}</div>
        <h2 className="text-2xl font-bold text-foreground">Score : {score}/{AMINO_ACIDS.length}</h2>
        <Progress value={pct} className="w-64 h-3" />
        <p className="text-muted-foreground">{pct}% de bonnes réponses</p>

        {wrongAnswers.length > 0 && (
          <div className="w-full max-w-md space-y-2 mt-4">
            <h3 className="font-semibold text-foreground text-sm">Erreurs à revoir :</h3>
            {wrongAnswers.map((w, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="w-12 h-10">{w.question.structure}</div>
                <div className="text-sm">
                  <span className="text-destructive line-through">{AMINO_ACIDS.find(a => a.code1 === w.chosen)?.name}</span>
                  {" → "}
                  <span className="text-foreground font-semibold">{w.question.name}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button onClick={restart} className="mt-4">
          <RotateCcw className="h-4 w-4 mr-2" /> Recommencer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Progress */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {qIndex + 1}/{AMINO_ACIDS.length}</span>
          <span>Score : {score}</span>
        </div>
        <Progress value={((qIndex + 1) / AMINO_ACIDS.length) * 100} className="h-2" />
      </div>

      {/* Structure display */}
      <div className="bg-card border-2 border-border rounded-2xl p-6 w-full max-w-sm">
        <p className="text-center text-sm text-muted-foreground mb-3">Quel acide aminé a cette structure ?</p>
        <div className="w-56 h-44 mx-auto">{current.structure}</div>
        <div className="flex justify-center mt-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[current.category] + "20", color: CATEGORY_COLORS[current.category] }}
          >
            {current.categoryLabel}
          </span>
        </div>
      </div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {choices.map((c) => {
          let variant: "outline" | "default" | "destructive" = "outline";
          let extraClass = "";
          if (selected) {
            if (c.code1 === current.code1) {
              variant = "default";
              extraClass = "bg-emerald-600 hover:bg-emerald-600 border-emerald-600 text-white";
            } else if (c.code1 === selected) {
              variant = "destructive";
            }
          }
          return (
            <motion.div key={c.code1} whileTap={{ scale: 0.97 }}>
              <Button
                variant={variant}
                className={`w-full h-auto py-3 text-left justify-start ${extraClass}`}
                onClick={() => handleSelect(c.code1)}
                disabled={!!selected}
              >
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs opacity-70">{c.code3} ({c.code1})</div>
                </div>
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Feedback */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${isCorrect ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`}
        >
          {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {isCorrect ? "Correct !" : `La bonne réponse était ${current.name} (${current.code1})`}
        </motion.div>
      )}

      {selected && (
        <Button onClick={handleNext}>
          {qIndex + 1 >= AMINO_ACIDS.length ? "Voir les résultats" : "Question suivante →"}
        </Button>
      )}
    </div>
  );
}
