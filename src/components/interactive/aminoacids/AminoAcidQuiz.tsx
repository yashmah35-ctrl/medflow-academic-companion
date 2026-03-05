import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Layers, FlaskConical, Zap } from "lucide-react";
import FlashcardsMode from "./FlashcardsMode";
import StructureQuizMode from "./StructureQuizMode";
import QuickQuizMode from "./QuickQuizMode";

type Mode = "menu" | "flashcards" | "structure" | "quick";

const modes = [
  {
    id: "flashcards" as const,
    title: "Flashcards",
    description: "Apprends les 20 acides aminés un par un : nom, codes, structure et propriétés.",
    icon: Layers,
    color: "#3b82f6",
  },
  {
    id: "structure" as const,
    title: "Structure → Nom",
    description: "Identifie l'acide aminé à partir de sa structure chimique. 20 questions.",
    icon: FlaskConical,
    color: "#10b981",
  },
  {
    id: "quick" as const,
    title: "Quiz Rapide",
    description: "Questions mixtes : nom→code, code→nom, propriétés→nom. Avec chrono optionnel.",
    icon: Zap,
    color: "#f59e0b",
  },
];

export default function AminoAcidQuiz() {
  const [mode, setMode] = useState<Mode>("menu");

  if (mode === "flashcards") return <WithBack onBack={() => setMode("menu")} title="Flashcards"><FlashcardsMode /></WithBack>;
  if (mode === "structure") return <WithBack onBack={() => setMode("menu")} title="Structure → Nom"><StructureQuizMode /></WithBack>;
  if (mode === "quick") return <WithBack onBack={() => setMode("menu")} title="Quiz Rapide"><QuickQuizMode /></WithBack>;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">🧬 Quiz Acides Aminés</h2>
        <p className="text-sm text-muted-foreground">Choisis ton mode d'apprentissage</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {modes.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <button
              onClick={() => setMode(m.id)}
              className="w-full text-left rounded-2xl border-2 border-border bg-card p-5 hover:shadow-lg transition-all hover:scale-[1.02] group"
              style={{ borderColor: m.color + "30" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: m.color + "15" }}
              >
                <m.icon className="h-5 w-5" style={{ color: m.color }} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{m.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function WithBack({ onBack, title, children }: { onBack: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>← Modes</Button>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}
