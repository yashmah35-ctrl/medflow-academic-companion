import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { generateMedicalQuiz, type MedicalQuizQuestion } from "@/data/medicalElements";

export default function PeriodicTableQuiz() {
  const [questions, setQuestions] = useState(() => generateMedicalQuiz());
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [wrongs, setWrongs] = useState<{ q: MedicalQuizQuestion; chosen: string }[]>([]);

  const current = questions[qIndex];
  const isCorrect = selected === current?.correctAnswer;

  const handleSelect = (answer: string) => {
    if (selected) return;
    setSelected(answer);
    if (answer === current.correctAnswer) setScore(s => s + 1);
    else setWrongs(w => [...w, { q: current, chosen: answer }]);
  };

  const handleNext = () => {
    if (qIndex + 1 >= 20) { setFinished(true); return; }
    setQIndex(i => i + 1);
    setSelected(null);
  };

  const restart = () => {
    setQuestions(generateMedicalQuiz());
    setQIndex(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
    setWrongs([]);
  };

  if (finished) {
    const pct = Math.round((score / 20) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-6xl">{pct >= 80 ? "🏆" : pct >= 50 ? "✨" : "💪"}</div>
        <h2 className="text-2xl font-bold text-foreground">Score : {score}/20</h2>
        <Progress value={pct} className="w-64 h-3" />
        {wrongs.length > 0 && (
          <div className="w-full max-w-md space-y-2 mt-4">
            <h3 className="font-semibold text-sm text-foreground">Erreurs à revoir :</h3>
            {wrongs.map((w, i) => (
              <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm">
                <p className="text-muted-foreground text-xs mb-1">{w.q.prompt}</p>
                <span className="text-destructive line-through">{w.chosen}</span>
                {" → "}
                <span className="font-semibold text-foreground">{w.q.correctAnswer}</span>
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
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="w-full max-w-md space-y-3">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {qIndex + 1}/20</span>
          <span>Score : {score}</span>
        </div>
        <Progress value={((qIndex + 1) / 20) * 100} className="h-2" />
      </div>

      <div className="bg-card border-2 border-border rounded-2xl p-6 w-full max-w-md text-center">
        <p className="text-xs text-muted-foreground mb-2">
          {current.type === "symbol2role" ? "Élément → Rôle" : "Pathologie → Élément"}
        </p>
        <h3 className="text-lg font-semibold text-foreground leading-relaxed">{current.prompt}</h3>
      </div>

      <div className="grid grid-cols-1 gap-2 w-full max-w-md">
        {current.choices.map(c => {
          let extraClass = "";
          if (selected) {
            if (c === current.correctAnswer) extraClass = "bg-emerald-600 hover:bg-emerald-600 border-emerald-600 text-white";
            else if (c === selected) extraClass = "bg-destructive hover:bg-destructive border-destructive text-white";
          }
          return (
            <motion.div key={c} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className={`w-full py-3 text-sm justify-start text-left whitespace-normal h-auto ${extraClass}`}
                onClick={() => handleSelect(c)}
                disabled={!!selected}
              >
                {c}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${isCorrect ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300" : "bg-destructive/10 text-destructive"}`}
        >
          {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {isCorrect ? "Bravo !" : `Réponse : ${current.correctAnswer}`}
        </motion.div>
      )}

      {selected && (
        <Button onClick={handleNext}>
          {qIndex + 1 >= 20 ? "Voir les résultats" : "Suivante →"}
        </Button>
      )}
    </div>
  );
}
