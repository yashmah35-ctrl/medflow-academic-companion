import { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Loader2 } from "lucide-react";
import AminoAcidQuiz from "@/components/interactive/aminoacids/AminoAcidQuiz";
import PeriodicTableModule from "@/components/interactive/periodictable/PeriodicTableModule";
import SchemaModule from "@/components/interactive/schemas/SchemaModule";

const Heart3DViewer = lazy(() => import("@/components/interactive/Heart3DViewer"));

const modules = [
  {
    id: 1,
    title: "Cœur 3D Interactif",
    description: "Explore l'anatomie du cœur en 3D : ventricules, oreillettes, valves et vaisseaux.",
    icon: "❤️",
    available: true,
    comingSoon: false,
    viewer: "heart3d" as const,
  },
  {
    id: 2,
    title: "Quiz Acides Aminés",
    description: "Flashcards sur les 20 acides aminés : structure, nom, propriétés, code à 1 et 3 lettres.",
    icon: "🧬",
    available: true,
    comingSoon: false,
    viewer: "aminoacids" as const,
  },
  {
    id: 3,
    title: "Tableau Périodique Médical",
    description: "Tableau périodique interactif centré sur les éléments d'intérêt médical : essentiels, oligo-éléments et toxiques.",
    icon: "⚛️",
    available: true,
    comingSoon: false,
    viewer: "periodictable" as const,
  },
  {
    id: 4,
    title: "Schémas à Compléter",
    description: "Importe un schéma annoté, place des repères et teste ta mémoire en retrouvant tous les labels.",
    icon: "🖼️",
    available: true,
    comingSoon: false,
    viewer: "schemas" as const,
  },
  {
    id: 5,
    title: "ECG Simulator",
    description: "Apprends à lire et interpréter les tracés ECG.",
    icon: "🫀",
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
  const [activeViewer, setActiveViewer] = useState<string | null>(null);

  if (activeViewer === "periodictable") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActiveViewer(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Tableau Périodique Interactif</h1>
            <p className="text-xs text-muted-foreground">Explore les 118 éléments de manière interactive</p>
          </div>
        </div>
        <div className="overflow-hidden">
          <iframe
            src="https://v0-periodic-table-experiment.vercel.app/"
            className="w-full border-0"
            style={{ minHeight: "800px" }}
            title="Tableau Périodique Interactif"
          />
        </div>
      </div>
    );
  }

  if (activeViewer === "aminoacids") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActiveViewer(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Quiz Acides Aminés</h1>
            <p className="text-xs text-muted-foreground">Quiz interactif sur les 20 acides aminés</p>
          </div>
        </div>
        <div className="rounded-xl border border-border overflow-hidden bg-card p-4" style={{ minHeight: "calc(100vh - 200px)" }}>
          <AminoAcidQuiz />
        </div>
      </div>
    );
  }

  if (activeViewer === "heart3d") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setActiveViewer(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Cœur 3D Interactif</h1>
            <p className="text-xs text-muted-foreground">Clique sur les zones colorées pour explorer chaque partie</p>
          </div>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Chargement du modèle 3D…</span>
            </div>
          }
        >
          <Heart3DViewer />
        </Suspense>
      </div>
    );
  }

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
              onClick={() => {
                if ("viewer" in m && m.viewer) {
                  setActiveViewer(m.viewer);
                }
              }}
            >
              {m.available ? "Lancer" : "Bientôt disponible"}
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
