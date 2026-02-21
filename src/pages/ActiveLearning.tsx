import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Brain, PenLine, ArrowRight } from "lucide-react";

type Mode = "select" | "questions" | "restitution" | "result";

const sampleQuestions = [
  {
    id: 1,
    question: "Quelle est la formule de la loi de Beer-Lambert ?",
    options: ["A = ε × l × c", "A = ε × l × c²", "A = ε² × l × c", "A = ε × l / c"],
    correct: 0,
    explanation:
      "La loi de Beer-Lambert s'écrit A = ε × l × c, où A est l'absorbance, ε le coefficient d'extinction molaire, l la longueur du trajet optique et c la concentration.",
  },
  {
    id: 2,
    question: "Quel est le potentiel de repos d'un neurone typique ?",
    options: ["-90 mV", "-70 mV", "-50 mV", "-30 mV"],
    correct: 1,
    explanation:
      "Le potentiel de repos d'un neurone est d'environ -70 mV, maintenu principalement par la pompe Na+/K+ ATPase.",
  },
  {
    id: 3,
    question: "Quelle enzyme catalyse la transcription de l'ADN en ARN ?",
    options: ["ADN polymérase", "ARN polymérase", "Hélicase", "Ligase"],
    correct: 1,
    explanation:
      "L'ARN polymérase est l'enzyme responsable de la transcription, synthétisant un brin d'ARN complémentaire à partir d'une matrice d'ADN.",
  },
];

export default function ActiveLearning() {
  const [mode, setMode] = useState<Mode>("select");
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [score, setScore] = useState(0);
  const [restitutionText, setRestitutionText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const q = sampleQuestions[currentQ];

  const handleAnswer = () => {
    setShowCorrection(true);
    if (selectedAnswer === q.correct) setScore((s) => s + 1);
  };

  const nextQuestion = () => {
    if (currentQ + 1 >= sampleQuestions.length) {
      setMode("result");
    } else {
      setCurrentQ((c) => c + 1);
      setSelectedAnswer(null);
      setShowCorrection(false);
    }
  };

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
            onClick={() => setMode("questions")}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
              <Brain className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Mode Questions</h3>
            <p className="text-sm text-muted-foreground">
              Réponds à des questions générées par l'IA sur le contenu de tes cours. QCM, questions ouvertes et cas cliniques.
            </p>
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
              Écris tout ce que tu as retenu d'un cours et reçois un feedback détaillé de l'IA.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (mode === "questions") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setMode("select")}>← Retour</Button>
          <Badge variant="secondary">
            Question {currentQ + 1}/{sampleQuestions.length}
          </Badge>
        </div>
        <Progress value={((currentQ + 1) / sampleQuestions.length) * 100} className="h-2" />

        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-xl border border-border bg-card p-6 space-y-5"
        >
          <h3 className="text-lg font-semibold text-foreground">{q.question}</h3>
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => !showCorrection && setSelectedAnswer(i)}
                className={`w-full text-left rounded-lg border p-3 text-sm transition-all ${
                  showCorrection
                    ? i === q.correct
                      ? "border-success bg-success/10 text-foreground"
                      : i === selectedAnswer
                      ? "border-destructive bg-destructive/10 text-foreground"
                      : "border-border text-muted-foreground"
                    : selectedAnswer === i
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border hover:border-primary/40 text-foreground"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {showCorrection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-lg bg-muted p-4 text-sm text-foreground"
            >
              <p className="font-medium mb-1">
                {selectedAnswer === q.correct ? "✅ Bonne réponse !" : "❌ Mauvaise réponse"}
              </p>
              <p className="text-muted-foreground">{q.explanation}</p>
            </motion.div>
          )}

          <div className="flex justify-end">
            {!showCorrection ? (
              <Button onClick={handleAnswer} disabled={selectedAnswer === null}>
                Corriger
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                Question suivante <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (mode === "restitution") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setMode("select")}>← Retour</Button>
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h3 className="text-lg font-semibold text-foreground">Restitution Libre</h3>
          <p className="text-sm text-muted-foreground">
            Écris tout ce que tu as retenu de ce cours. L'IA analysera ta restitution.
          </p>
          <Textarea
            placeholder="Écris tout ce que tu as retenu de ce cours..."
            className="min-h-[200px]"
            value={restitutionText}
            onChange={(e) => setRestitutionText(e.target.value)}
          />
          <Button onClick={() => setShowFeedback(true)} disabled={restitutionText.length < 10}>
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

  // Result
  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="text-6xl mb-4">{score === sampleQuestions.length ? "🎉" : "📊"}</div>
        <h2 className="text-2xl font-bold text-foreground">Résultats</h2>
        <p className="text-lg text-muted-foreground mt-2">
          {score}/{sampleQuestions.length} bonnes réponses
        </p>
        <Progress value={(score / sampleQuestions.length) * 100} className="h-3 mt-4" />
      </motion.div>
      <Button onClick={() => { setMode("select"); setCurrentQ(0); setScore(0); setSelectedAnswer(null); setShowCorrection(false); }}>
        Recommencer
      </Button>
    </div>
  );
}
