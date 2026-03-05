import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, XCircle, RotateCcw, Timer } from "lucide-react";
import { AMINO_ACIDS, type AminoAcid } from "@/data/aminoAcids";

type QuestionType = "name2code" | "code2name" | "prop2name";

interface Question {
  type: QuestionType;
  prompt: string;
  correct: AminoAcid;
  choices: string[];
  correctAnswer: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(): Question[] {
  const pool = shuffle([...AMINO_ACIDS]);
  const questions: Question[] = [];
  const types: QuestionType[] = ["name2code", "code2name", "prop2name"];

  for (let i = 0; i < 20; i++) {
    const aa = pool[i % pool.length];
    const type = types[i % types.length];
    const others = AMINO_ACIDS.filter((a) => a.code1 !== aa.code1);
    const wrongPool = shuffle(others).slice(0, 3);

    let prompt: string, correctAnswer: string, choices: string[];
    switch (type) {
      case "name2code":
        prompt = `Quel est le code à 1 lettre de ${aa.name} ?`;
        correctAnswer = aa.code1;
        choices = shuffle([aa.code1, ...wrongPool.map((w) => w.code1)]);
        break;
      case "code2name":
        prompt = `Quel acide aminé correspond au code "${aa.code3}" ?`;
        correctAnswer = aa.name;
        choices = shuffle([aa.name, ...wrongPool.map((w) => w.name)]);
        break;
      case "prop2name":
        prompt = aa.properties.split(".")[0] + ". De quel acide aminé s'agit-il ?";
        correctAnswer = aa.name;
        choices = shuffle([aa.name, ...wrongPool.map((w) => w.name)]);
        break;
    }
    questions.push({ type, prompt, correct: aa, choices, correctAnswer });
  }
  return questions;
}

export default function QuickQuizMode() {
  const [questions, setQuestions] = useState(() => generateQuestions());
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<{ q: Question; chosen: string }[]>([]);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerEnabled && !finished) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerEnabled, finished]);

  const current = questions[qIndex];
  const isCorrect = selected === current.correctAnswer;

  const handleSelect = (answer: string) => {
    if (selected) return;
    setSelected(answer);
    if (answer === current.correctAnswer) setScore((s) => s + 1);
    else setWrongAnswers((w) => [...w, { q: current, chosen: answer }]);
  };

  const handleNext = () => {
    if (qIndex + 1 >= 20) { setFinished(true); return; }
    setQIndex((i) => i + 1);
    setSelected(null);
  };

  const restart = () => {
    setQuestions(generateQuestions());
    setQIndex(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
    setWrongAnswers([]);
    setElapsed(0);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (finished) {
    const pct = Math.round((score / 20) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-6xl">{pct >= 80 ? "🏆" : pct >= 50 ? "✨" : "💪"}</div>
        <h2 className="text-2xl font-bold text-foreground">Score : {score}/20</h2>
        <Progress value={pct} className="w-64 h-3" />
        {timerEnabled && <p className="text-sm text-muted-foreground">Temps : {formatTime(elapsed)}</p>}

        {wrongAnswers.length > 0 && (
          <div className="w-full max-w-md space-y-2 mt-4">
            <h3 className="font-semibold text-sm text-foreground">Erreurs à revoir :</h3>
            {wrongAnswers.map((w, i) => (
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
      {/* Timer toggle + progress */}
      <div className="w-full max-w-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Chrono</span>
            <Switch checked={timerEnabled} onCheckedChange={setTimerEnabled} />
          </div>
          {timerEnabled && <span className="text-sm font-mono text-foreground">{formatTime(elapsed)}</span>}
          <span className="text-sm text-muted-foreground">Score : {score}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {qIndex + 1}/20</span>
        </div>
        <Progress value={((qIndex + 1) / 20) * 100} className="h-2" />
      </div>

      {/* Question */}
      <div className="bg-card border-2 border-border rounded-2xl p-6 w-full max-w-md text-center">
        <p className="text-xs text-muted-foreground mb-2">
          {current.type === "name2code" ? "Nom → Code" : current.type === "code2name" ? "Code → Nom" : "Propriété → Nom"}
        </p>
        <h3 className="text-lg font-semibold text-foreground leading-relaxed">{current.prompt}</h3>
      </div>

      {/* Choices */}
      <div className="grid grid-cols-1 gap-2 w-full max-w-md">
        {current.choices.map((c) => {
          let extraClass = "";
          if (selected) {
            if (c === current.correctAnswer) extraClass = "bg-emerald-600 hover:bg-emerald-600 border-emerald-600 text-white";
            else if (c === selected) extraClass = "bg-destructive hover:bg-destructive border-destructive text-white";
          }
          return (
            <motion.div key={c} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className={`w-full py-3 text-base justify-center ${extraClass}`}
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
