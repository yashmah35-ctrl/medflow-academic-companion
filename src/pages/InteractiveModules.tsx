import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bone, FlaskConical, Puzzle as PuzzleIcon, Stethoscope } from "lucide-react";

const modules = [
  {
    id: 1,
    title: "Anatomie 3D",
    description: "Explore le corps humain en 3D avec un viewer interactif.",
    icon: "🦴",
    available: false,
    comingSoon: true,
  },
  {
    id: 2,
    title: "Quiz Acides Aminés",
    description: "Flashcards sur les 20 acides aminés : structure, nom, propriétés, code à 1 et 3 lettres.",
    icon: "🧬",
    available: true,
    comingSoon: false,
  },
  {
    id: 3,
    title: "Cycle de Krebs Interactif",
    description: "Visualise et apprends chaque étape du cycle de Krebs.",
    icon: "🔄",
    available: false,
    comingSoon: true,
  },
  {
    id: 4,
    title: "ECG Simulator",
    description: "Apprends à lire et interpréter les tracés ECG.",
    icon: "❤️",
    available: false,
    comingSoon: true,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function InteractiveModules() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Modules Interactifs</h1>
        <p className="text-muted-foreground mt-1">
          Des outils interactifs pour apprendre de manière ludique.
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {modules.map((m) => (
          <motion.div
            key={m.id}
            variants={item}
            className={`rounded-xl border border-border bg-card p-6 flex flex-col ${
              m.comingSoon ? "opacity-70" : "hover:shadow-lg transition-shadow"
            }`}
          >
            <div className="text-4xl mb-4">{m.icon}</div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground">{m.title}</h3>
              {m.comingSoon && (
                <Badge variant="secondary" className="text-xs">Bientôt</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex-1">{m.description}</p>
            <Button
              className="mt-4 w-full"
              variant={m.available ? "default" : "secondary"}
              disabled={!m.available}
            >
              {m.available ? "Lancer" : "Bientôt disponible"}
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
