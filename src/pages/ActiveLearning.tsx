import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertTriangle, Layers, PenLine, ArrowRight, RotateCcw, Upload, Image, Type } from "lucide-react";
import { subjects } from "@/data/mockData";

type Mode = "select" | "flashcards" | "restitution" | "result";
type FlashcardType = "text" | "image-occlusion";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  type: FlashcardType;
}

const sampleFlashcards: Flashcard[] = [
  { id: 1, front: "Quelle est la formule de la loi de Beer-Lambert ?", back: "A = ε × l × c\n\nA : absorbance\nε : coefficient d'extinction molaire\nl : longueur du trajet optique\nc : concentration", type: "text" },
  { id: 2, front: "Quel est le potentiel de repos d'un neurone typique ?", back: "-70 mV\n\nMaintenu principalement par la pompe Na⁺/K⁺ ATPase (3 Na⁺ sortent, 2 K⁺ entrent)", type: "text" },
  { id: 3, front: "Quelle enzyme catalyse la transcription de l'ADN en ARN ?", back: "L'ARN polymérase\n\nElle synthétise un brin d'ARN complémentaire à partir d'une matrice d'ADN, dans le sens 5' → 3'.", type: "text" },
  { id: 4, front: "Quels sont les 3 feuillets embryonnaires et leurs dérivés principaux ?", back: "1. Ectoderme → SNC, peau\n2. Mésoderme → muscles, os, cœur\n3. Endoderme → tube digestif, poumons", type: "text" },
  { id: 5, front: "Citez les 4 bases azotées de l'ADN", back: "Purines : Adénine (A), Guanine (G)\nPyrimidines : Cytosine (C), Thymine (T)\n\nA=T (2 liaisons H)\nG≡C (3 liaisons H)", type: "text" },
];

// Courses mock per subject
const coursesBySubject: Record<string, string[]> = {
  '1': ['Chimie Organique - Alcools', 'Chimie Générale - Atomistique', 'Biochimie - Enzymes'],
  '2': ['Membrane & Transport', 'Cycle Cellulaire', 'Organites'],
  '3': ['Optique', 'Radioactivité', 'Mécanique des fluides'],
  '4': ['Membre supérieur', 'Membre inférieur', 'Tronc'],
  '5': ['Réplication ADN', 'Transcription', 'Traduction'],
};

export default function ActiveLearning() {
  const [mode, setMode] = useState<Mode>("select");
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [restitutionText, setRestitutionText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const card = sampleFlashcards[currentCard];

  const rateCard = (rating: string) => {
    setRatings((prev) => ({ ...prev, [card.id]: rating }));
    if (currentCard + 1 >= sampleFlashcards.length) {
      setMode("result");
    } else {
      setCurrentCard((c) => c + 1);
      setIsFlipped(false);
    }
  };

  const goodCount = Object.values(ratings).filter((r) => r === "good" || r === "easy").length;

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
            onClick={() => setMode("flashcards")}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
              <Layers className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Flashcards</h3>
            <p className="text-sm text-muted-foreground">
              Révise avec des flashcards style Anki. Importe des photos, crée des occlusions d'image ou du texte. L'IA génère aussi des questions.
            </p>
            <div className="flex gap-2 mt-3">
              <Badge variant="secondary" className="text-xs"><Type className="h-3 w-3 mr-1" />Texte</Badge>
              <Badge variant="secondary" className="text-xs"><Image className="h-3 w-3 mr-1" />Occlusion</Badge>
              <Badge variant="secondary" className="text-xs"><Upload className="h-3 w-3 mr-1" />Import</Badge>
            </div>
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
              Choisis une matière et un cours, puis écris tout ce que tu as retenu. Reçois un feedback détaillé de l'IA.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (mode === "flashcards") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => { setMode("select"); setCurrentCard(0); setIsFlipped(false); setRatings({}); }}>← Retour</Button>
          <Badge variant="secondary">Carte {currentCard + 1}/{sampleFlashcards.length}</Badge>
        </div>
        <Progress value={((currentCard + 1) / sampleFlashcards.length) * 100} className="h-2" />

        {/* Flashcard */}
        <motion.div
          key={currentCard}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative"
        >
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="rounded-xl border border-border bg-card p-8 min-h-[280px] flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-all select-none"
          >
            {!isFlipped ? (
              <div className="text-center space-y-4">
                <Badge variant="outline" className="text-xs mb-2">Question</Badge>
                <h3 className="text-lg font-semibold text-foreground">{card.front}</h3>
                <p className="text-sm text-muted-foreground mt-4">Clique pour voir la réponse</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-4 w-full"
              >
                <Badge variant="outline" className="text-xs mb-2 border-success text-success">Réponse</Badge>
                <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">{card.back}</div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Rating buttons (Anki style) */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-2"
          >
            <Button
              variant="outline"
              className="flex flex-col py-3 h-auto border-destructive/30 hover:bg-destructive/10 text-destructive"
              onClick={() => rateCard("again")}
            >
              <RotateCcw className="h-4 w-4 mb-1" />
              <span className="text-xs font-semibold">À revoir</span>
              <span className="text-[10px] text-muted-foreground">&lt;1 min</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col py-3 h-auto border-warning/30 hover:bg-warning/10 text-warning"
              onClick={() => rateCard("hard")}
            >
              <span className="text-sm mb-1">😓</span>
              <span className="text-xs font-semibold">Difficile</span>
              <span className="text-[10px] text-muted-foreground">1 jour</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col py-3 h-auto border-success/30 hover:bg-success/10 text-success"
              onClick={() => rateCard("good")}
            >
              <span className="text-sm mb-1">😊</span>
              <span className="text-xs font-semibold">Bien</span>
              <span className="text-[10px] text-muted-foreground">3 jours</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col py-3 h-auto border-primary/30 hover:bg-primary/10 text-primary"
              onClick={() => rateCard("easy")}
            >
              <span className="text-sm mb-1">🎯</span>
              <span className="text-xs font-semibold">Facile</span>
              <span className="text-[10px] text-muted-foreground">7 jours</span>
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  if (mode === "restitution") {
    const availableCourses = selectedSubject ? (coursesBySubject[selectedSubject] || []) : [];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => { setMode("select"); setShowFeedback(false); setRestitutionText(""); setSelectedSubject(""); setSelectedCourse(""); }}>← Retour</Button>
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h3 className="text-lg font-semibold text-foreground">Restitution Libre</h3>
          <p className="text-sm text-muted-foreground">
            Choisis ta matière et ton cours, puis écris tout ce que tu as retenu.
          </p>

          {/* Subject & Course selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Matière</label>
              <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); setSelectedCourse(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisis une matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Cours</label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse} disabled={!selectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisis un cours" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((c, i) => (
                    <SelectItem key={i} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            placeholder="Écris tout ce que tu as retenu de ce cours..."
            className="min-h-[200px]"
            value={restitutionText}
            onChange={(e) => setRestitutionText(e.target.value)}
            disabled={!selectedCourse}
          />
          <Button onClick={() => setShowFeedback(true)} disabled={restitutionText.length < 10 || !selectedCourse}>
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
        <div className="text-6xl mb-4">{goodCount === sampleFlashcards.length ? "🎉" : "📊"}</div>
        <h2 className="text-2xl font-bold text-foreground">Résultats</h2>
        <p className="text-lg text-muted-foreground mt-2">
          {goodCount}/{sampleFlashcards.length} cartes maîtrisées
        </p>
        <Progress value={(goodCount / sampleFlashcards.length) * 100} className="h-3 mt-4" />
        <div className="grid grid-cols-4 gap-2 mt-4 text-sm">
          <div className="rounded-lg bg-destructive/10 p-2">
            <p className="font-bold text-destructive">{Object.values(ratings).filter(r => r === "again").length}</p>
            <p className="text-xs text-muted-foreground">À revoir</p>
          </div>
          <div className="rounded-lg bg-warning/10 p-2">
            <p className="font-bold text-warning">{Object.values(ratings).filter(r => r === "hard").length}</p>
            <p className="text-xs text-muted-foreground">Difficile</p>
          </div>
          <div className="rounded-lg bg-success/10 p-2">
            <p className="font-bold text-success">{Object.values(ratings).filter(r => r === "good").length}</p>
            <p className="text-xs text-muted-foreground">Bien</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <p className="font-bold text-primary">{Object.values(ratings).filter(r => r === "easy").length}</p>
            <p className="text-xs text-muted-foreground">Facile</p>
          </div>
        </div>
      </motion.div>
      <Button onClick={() => { setMode("select"); setCurrentCard(0); setIsFlipped(false); setRatings({}); }}>
        Recommencer
      </Button>
    </div>
  );
}
