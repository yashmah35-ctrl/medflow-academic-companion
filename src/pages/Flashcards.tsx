import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, Layers, BarChart3, Flame, Clock, Trash2, Edit3, Play,
  RotateCcw, ArrowLeft, BookOpen, ChevronRight, X, Type, ImageIcon, Upload, FileText, Sparkles, Loader2,
  ArrowDown, Star, Trophy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  SRSRating, updateCardState, getCardState, getDueCardIds,
  getButtonPreviews, computeSRSTransition, loadSRSState
} from "@/lib/srs";

// ─── Types ──────────────────────────────────────────
interface Deck {
  id: string;
  name: string;
  description: string | null;
  subject_id: string | null;
  tags: string[];
  created_at: string;
  cardCount: number;
  dueCount: number;
  mastery: number;
}

interface Card {
  id: string;
  deck_id: string;
  card_type: string;
  front: string;
  back: string;
  explanation: string | null;
  cloze_text: string | null;
  difficulty: number;
  ease_factor: number;
  interval_days: number;
  next_review: string;
  review_count: number;
}

type View = "decks" | "deck-detail" | "card-editor" | "review" | "review-result";

// ─── Spaced Repetition Algorithm ────────────────────
function computeNextReview(card: Card, rating: string) {
  let { ease_factor, interval_days } = card;
  const ef = Number(ease_factor);

  switch (rating) {
    case "again":
      return { interval_days: 0, ease_factor: Math.max(1.3, ef - 0.2), difficulty: 3 };
    case "hard":
      return { interval_days: Math.max(1, Math.round(interval_days * 1.2)), ease_factor: Math.max(1.3, ef - 0.15), difficulty: 2 };
    case "good":
      return { interval_days: interval_days === 0 ? 1 : Math.round(interval_days * ef), ease_factor: ef, difficulty: 2 };
    case "easy":
      return { interval_days: interval_days === 0 ? 4 : Math.round(interval_days * ef * 1.3), ease_factor: ef + 0.15, difficulty: 2 };
    default:
      return { interval_days, ease_factor: ef, difficulty: 2 };
  }
}

// ─── Cloze helpers ──────────────────────────────────
function parseCloze(text: string): { question: string; answer: string }[] {
  const regex = /\{\{c\d+::(.+?)\}\}/g;
  const results: { question: string; answer: string }[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const answer = match[1];
    const question = text.replace(match[0], "[...]");
    results.push({ question, answer });
  }
  return results.length ? results : [{ question: text, answer: "" }];
}

export default function Flashcards() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("decks");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Create deck dialog
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [newDeckSubject, setNewDeckSubject] = useState("");

  // Card editor
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [cardType, setCardType] = useState<"qr" | "cloze">("qr");
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [cardExplanation, setCardExplanation] = useState("");
  const [cardCloze, setCardCloze] = useState("");

  // Review
  const [reviewCards, setReviewCards] = useState<Card[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewRatings, setReviewRatings] = useState<Record<string, string>>({});
  const [reviewStartTime, setReviewStartTime] = useState<number>(0);

  // AI Import
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState("");
  const [importFile, setImportFile] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [importCardCount, setImportCardCount] = useState("10");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<{ front: string; back: string; explanation?: string }[]>([]);

  // ─── Fetch decks ─────────────────────────────────
  const fetchDecks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: deckRows, error } = await supabase
      .from("flashcard_decks")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) { toast.error("Erreur chargement decks"); setLoading(false); return; }

    // Get card counts per deck
    const deckList: Deck[] = [];
    for (const d of deckRows || []) {
      const { count: totalCount } = await supabase
        .from("flashcards").select("*", { count: "exact", head: true })
        .eq("deck_id", d.id);
      const { count: dueCount } = await supabase
        .from("flashcards").select("*", { count: "exact", head: true })
        .eq("deck_id", d.id).lte("next_review", new Date().toISOString());

      const total = totalCount || 0;
      const due = dueCount || 0;
      const mastery = total > 0 ? Math.round(((total - due) / total) * 100) : 0;

      deckList.push({
        id: d.id,
        name: d.name,
        description: d.description,
        subject_id: d.subject_id,
        tags: d.tags || [],
        created_at: d.created_at,
        cardCount: total,
        dueCount: due,
        mastery,
      });
    }
    setDecks(deckList);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  // Fetch subjects from DB
  useEffect(() => {
    supabase.from("subjects").select("id, name, icon").then(({ data }) => {
      if (data) setSubjects(data);
    });
  }, []);

  // ─── Fetch cards for a deck ──────────────────────
  const fetchCards = async (deckId: string) => {
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", deckId)
      .order("created_at", { ascending: true });
    if (error) toast.error("Erreur chargement cartes");
    setCards((data as Card[]) || []);
  };

  // ─── Create deck ─────────────────────────────────
  const handleCreateDeck = async () => {
    if (!user || !newDeckName.trim()) return;
    const { error } = await supabase.from("flashcard_decks").insert({
      user_id: user.id,
      name: newDeckName.trim(),
      description: newDeckDesc.trim() || null,
      subject_id: newDeckSubject || null,
    });
    if (error) { toast.error("Erreur création deck"); return; }
    toast.success("Deck créé !");
    setNewDeckName(""); setNewDeckDesc(""); setNewDeckSubject("");
    setShowCreateDeck(false);
    fetchDecks();
  };

  // ─── Delete deck ─────────────────────────────────
  const handleDeleteDeck = async (deckId: string) => {
    const { error } = await supabase.from("flashcard_decks").delete().eq("id", deckId);
    if (error) { toast.error("Erreur suppression"); return; }
    toast.success("Deck supprimé");
    if (selectedDeck?.id === deckId) { setView("decks"); setSelectedDeck(null); }
    fetchDecks();
  };

  // ─── Open deck detail ────────────────────────────
  const openDeck = (deck: Deck) => {
    setSelectedDeck(deck);
    setView("deck-detail");
    fetchCards(deck.id);
  };

  // ─── Save card ───────────────────────────────────
  const handleSaveCard = async () => {
    if (!user || !selectedDeck) return;
    const payload: any = {
      deck_id: selectedDeck.id,
      user_id: user.id,
      card_type: cardType,
      front: cardType === "cloze" ? parseCloze(cardCloze)[0]?.question || "" : cardFront,
      back: cardType === "cloze" ? parseCloze(cardCloze)[0]?.answer || "" : cardBack,
      explanation: cardExplanation || null,
      cloze_text: cardType === "cloze" ? cardCloze : null,
    };

    if (editingCard) {
      const { error } = await supabase.from("flashcards").update(payload).eq("id", editingCard.id);
      if (error) { toast.error("Erreur mise à jour"); return; }
      toast.success("Carte modifiée");
    } else {
      const { error } = await supabase.from("flashcards").insert(payload);
      if (error) { toast.error("Erreur création carte"); return; }
      toast.success("Carte créée");
    }
    resetCardForm();
    fetchCards(selectedDeck.id);
    fetchDecks();
    setView("deck-detail");
  };

  const resetCardForm = () => {
    setEditingCard(null);
    setCardType("qr"); setCardFront(""); setCardBack(""); setCardExplanation(""); setCardCloze("");
  };

  const openCardEditor = (card?: Card) => {
    if (card) {
      setEditingCard(card);
      setCardType(card.card_type as "qr" | "cloze");
      setCardFront(card.front);
      setCardBack(card.back);
      setCardExplanation(card.explanation || "");
      setCardCloze(card.cloze_text || "");
    } else {
      resetCardForm();
    }
    setView("card-editor");
  };

  const handleDeleteCard = async (cardId: string) => {
    await supabase.from("flashcards").delete().eq("id", cardId);
    toast.success("Carte supprimée");
    if (selectedDeck) fetchCards(selectedDeck.id);
    fetchDecks();
  };

  // ─── AI Import ──────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isWord = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      || file.type === "application/msword"
      || file.name.endsWith(".docx") || file.name.endsWith(".doc");

    if (isWord) {
      // Word files: extract text client-side since Gemini doesn't support Word MIME
      try {
        const arrayBuffer = await file.arrayBuffer();
        const { renderAsync } = await import("docx-preview");
        const container = document.createElement("div");
        await renderAsync(arrayBuffer, container);
        const extractedText = container.innerText || container.textContent || "";
        if (!extractedText.trim()) {
          toast.error("Impossible d'extraire le texte du fichier Word.");
          return;
        }
        setImportText(extractedText.substring(0, 15000));
        setImportFile(null);
        toast.success("Texte extrait du fichier Word !");
      } catch (err) {
        console.error("Word extraction error:", err);
        toast.error("Erreur lors de la lecture du fichier Word.");
      }
      return;
    }

    // PDF and images: send as base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setImportFile({ base64, mimeType: file.type, name: file.name });
      setImportText("");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateFlashcards = async () => {
    if ((!importText.trim() && !importFile) || !selectedDeck || !user) return;
    setIsGenerating(true);
    setGeneratedCards([]);
    try {
      const subj = subjects.find(s => s.id === selectedDeck.subject_id);
      const body: any = { subject: subj?.name, cardCount: parseInt(importCardCount) || 10 };
      if (importFile) {
        body.fileBase64 = importFile.base64;
        body.fileMimeType = importFile.mimeType;
      } else {
        body.content = importText;
      }
      const { data, error } = await supabase.functions.invoke("generate-flashcards", { body });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setIsGenerating(false); return; }
      const cards = data?.flashcards || [];
      if (cards.length === 0) { toast.error("Aucune flashcard générée."); setIsGenerating(false); return; }
      setGeneratedCards(cards);
      toast.success(`${cards.length} flashcards générées !`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la génération IA.");
    }
    setIsGenerating(false);
  };

  const handleImportGeneratedCards = async () => {
    if (!user || !selectedDeck || generatedCards.length === 0) return;
    const inserts = generatedCards.map(c => ({
      deck_id: selectedDeck.id,
      user_id: user.id,
      card_type: "qr",
      front: c.front,
      back: c.back,
      explanation: c.explanation || null,
    }));
    const { error } = await supabase.from("flashcards").insert(inserts);
    if (error) { toast.error("Erreur lors de l'import"); return; }
    toast.success(`${generatedCards.length} cartes importées !`);
    setShowImportDialog(false);
    setImportText("");
    setGeneratedCards([]);
    fetchCards(selectedDeck.id);
    fetchDecks();
  };

  // ─── Review ──────────────────────────────────────
  const startReview = async () => {
    if (!selectedDeck) return;
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", selectedDeck.id)
      .lte("next_review", new Date().toISOString())
      .order("next_review", { ascending: true });
    const reviewable = (data as Card[]) || [];
    if (reviewable.length === 0) { toast.info("Aucune carte à réviser !"); return; }
    setReviewCards(reviewable);
    setReviewIndex(0);
    setIsFlipped(false);
    setReviewRatings({});
    setReviewStartTime(Date.now());
    setView("review");
  };

  const rateReviewCard = async (rating: string) => {
    const card = reviewCards[reviewIndex];
    const next = computeNextReview(card, rating);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + next.interval_days);

    await supabase.from("flashcards").update({
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      difficulty: next.difficulty,
      next_review: nextReviewDate.toISOString(),
      review_count: card.review_count + 1,
    }).eq("id", card.id);

    await supabase.from("flashcard_reviews").insert({
      flashcard_id: card.id,
      user_id: user!.id,
      rating,
    });

    setReviewRatings((prev) => ({ ...prev, [card.id]: rating }));

    if (reviewIndex + 1 >= reviewCards.length) {
      setView("review-result");
      fetchDecks();
    } else {
      setReviewIndex((i) => i + 1);
      setIsFlipped(false);
    }
  };

  // ─── Keyboard shortcuts for review ───────────────
  useEffect(() => {
    if (view !== "review") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setIsFlipped(true); }
      if (isFlipped) {
        if (e.key === "1") rateReviewCard("again");
        if (e.key === "2") rateReviewCard("hard");
        if (e.key === "3") rateReviewCard("good");
        if (e.key === "4") rateReviewCard("easy");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [view, isFlipped, reviewIndex]);

  const filteredDecks = decks.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ═══════════════════════════════════════════════════
  // VIEWS
  // ═══════════════════════════════════════════════════

  // ─── DECK LIST ───────────────────────────────────
  if (view === "decks") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mes Flashcards</h1>
            <p className="text-sm text-muted-foreground mt-1">Organise tes decks et révise efficacement.</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCreateDeck} onOpenChange={setShowCreateDeck}>
              <DialogTrigger asChild>
                <Button className="rounded-xl font-semibold"><Plus className="h-4 w-4 mr-2" /> Nouveau Deck</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Créer un deck</DialogTitle><DialogDescription className="sr-only">Formulaire de création d'un nouveau deck de flashcards</DialogDescription></DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Nom du deck</Label>
                    <Input placeholder="Ex: Anatomie - Membre supérieur" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description (optionnel)</Label>
                    <Textarea placeholder="Description..." value={newDeckDesc} onChange={(e) => setNewDeckDesc(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Matière (optionnel)</Label>
                    <Select value={newDeckSubject} onValueChange={setNewDeckSubject}>
                      <SelectTrigger><SelectValue placeholder="Choisir une matière" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleCreateDeck} disabled={!newDeckName.trim()}>Créer le deck</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text" placeholder="Rechercher un deck..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-muted border border-border pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Deck Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">Chargement...</div>
        ) : filteredDecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Aucun deck trouvé.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Crée ton premier deck pour commencer à mémoriser !</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden" animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          >
            {filteredDecks.map((deck) => {
              const subj = subjects.find(s => s.id === deck.subject_id);
              return (
                <motion.div
                  key={deck.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  className="rounded-2xl border border-border bg-card p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                  onClick={() => openDeck(deck)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg">
                        {subj?.icon || "📘"}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm leading-tight">{deck.name}</h3>
                        {subj && <p className="text-[10px] text-muted-foreground">{subj.name}</p>}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteDeck(deck.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {deck.cardCount} cartes</span>
                    <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-warning" /> {deck.dueCount} à réviser</span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Maîtrise</span>
                      <span className="font-semibold text-foreground">{deck.mastery}%</span>
                    </div>
                    <Progress value={deck.mastery} className="h-2" />
                  </div>

                  {deck.dueCount > 0 && (
                    <div className="mt-auto">
                      <Button size="sm" className="w-full rounded-lg font-semibold" onClick={(e) => { e.stopPropagation(); openDeck(deck); }}>
                        <Play className="h-3 w-3 mr-1" /> Réviser
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    );
  }

  // ─── DECK DETAIL ─────────────────────────────────
  if (view === "deck-detail" && selectedDeck) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setView("decks"); setSelectedDeck(null); }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">{selectedDeck.name}</h1>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Layers, label: "Total", value: selectedDeck.cardCount, color: "text-primary" },
            { icon: Flame, label: "À réviser", value: selectedDeck.dueCount, color: "text-warning" },
            { icon: BarChart3, label: "Maîtrise", value: `${selectedDeck.mastery}%`, color: "text-success" },
            { icon: Clock, label: "Créé le", value: new Date(selectedDeck.created_at).toLocaleDateString("fr-FR"), color: "text-muted-foreground" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3 text-center">
              <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={startReview} disabled={selectedDeck.dueCount === 0} className="rounded-xl font-semibold">
            <Play className="h-4 w-4 mr-2" /> Réviser ({selectedDeck.dueCount})
          </Button>
          <Button variant="secondary" onClick={() => openCardEditor()} className="rounded-xl font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Ajouter une carte
          </Button>
          <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) { setImportText(""); setImportFile(null); setGeneratedCards([]); } }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl font-semibold">
                <Upload className="h-4 w-4 mr-2" /> Importer (IA)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Générer des flashcards par IA</DialogTitle><DialogDescription className="sr-only">Importer un fichier ou du texte pour générer des flashcards avec l'IA</DialogDescription></DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm text-muted-foreground">Importe un fichier PDF ou Word, ou colle le contenu de ton cours. L'IA générera automatiquement des flashcards.</p>

                {/* File upload */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Importer un fichier (PDF, Word)</Label>
                  <Input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileUpload} />
                  {importFile && (
                    <p className="text-xs text-success flex items-center gap-1">✓ {importFile.name} chargé</p>
                  )}
                </div>

                {/* Text area */}
                <div className="space-y-1.5">
                  <Label>Ou colle ton contenu ici</Label>
                  <Textarea
                    placeholder="Colle le contenu de ton cours ici..."
                    className="min-h-[150px] font-mono text-xs"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{importText.length} caractères</p>
                </div>

                {/* Card count */}
                <div className="space-y-1.5">
                  <Label>Nombre de flashcards à générer</Label>
                  <Select value={importCardCount} onValueChange={setImportCardCount}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["5", "10", "15", "20", "30"].map(n => (
                        <SelectItem key={n} value={n}>{n} cartes</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate button */}
                <Button
                  onClick={handleGenerateFlashcards}
                  disabled={(!importText.trim() && !importFile) || isGenerating}
                  className="w-full rounded-xl font-semibold"
                >
                  {isGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération en cours...</> : <><Sparkles className="h-4 w-4 mr-2" /> Générer les flashcards</>}
                </Button>

                {/* Preview generated cards */}
                {generatedCards.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">{generatedCards.length} flashcards générées :</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {generatedCards.map((c, i) => (
                        <div key={i} className="rounded-lg border border-border bg-muted/50 p-3 space-y-1">
                          <p className="text-xs font-semibold text-primary">Q: {c.front}</p>
                          <p className="text-xs text-foreground">R: {c.back}</p>
                          {c.explanation && <p className="text-[10px] text-muted-foreground italic">{c.explanation}</p>}
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleImportGeneratedCards} className="w-full rounded-xl font-semibold">
                      <Plus className="h-4 w-4 mr-2" /> Importer {generatedCards.length} cartes dans le deck
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards list */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cartes ({cards.length})</h3>
          {cards.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>Aucune carte dans ce deck.</p>
              <Button variant="link" onClick={() => openCardEditor()}>Créer ta première carte</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {cards.map((card) => (
                <div key={card.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {card.card_type === "cloze" ? "Cloze" : "Q/R"}
                      </Badge>
                      {card.review_count > 0 && (
                        <span className="text-[10px] text-muted-foreground">{card.review_count}× révisée</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground truncate">{card.card_type === "cloze" ? card.cloze_text : card.front}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openCardEditor(card)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteCard(card.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── CARD EDITOR ─────────────────────────────────
  if (view === "card-editor" && selectedDeck) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setView("deck-detail"); resetCardForm(); }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {editingCard ? "Modifier la carte" : "Nouvelle carte"}
          </h1>
        </div>

        <Tabs value={cardType} onValueChange={(v) => setCardType(v as "qr" | "cloze")} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="qr" className="flex-1"><Type className="h-4 w-4 mr-2" /> Question / Réponse</TabsTrigger>
            <TabsTrigger value="cloze" className="flex-1"><BookOpen className="h-4 w-4 mr-2" /> Texte à trous</TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Question (recto)</Label>
              <Textarea placeholder="Ex: Quel est le potentiel de repos d'un neurone ?" value={cardFront} onChange={(e) => setCardFront(e.target.value)} className="min-h-[100px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Réponse (verso)</Label>
              <Textarea placeholder="Ex: -70 mV, maintenu par la pompe Na+/K+ ATPase" value={cardBack} onChange={(e) => setCardBack(e.target.value)} className="min-h-[100px]" />
            </div>
          </TabsContent>

          <TabsContent value="cloze" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Texte avec trous</Label>
              <p className="text-xs text-muted-foreground">
                Utilise {"{{c1::réponse}}"} pour créer un trou. Ex: {"La mitochondrie produit {{c1::de l'ATP}}"}
              </p>
              <Textarea
                placeholder={"La mitochondrie est responsable de {{c1::la production d'ATP}}."}
                value={cardCloze} onChange={(e) => setCardCloze(e.target.value)} className="min-h-[120px] font-mono text-sm"
              />
              {cardCloze && parseCloze(cardCloze)[0]?.answer && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Aperçu :</p>
                  <p className="text-sm text-foreground">{parseCloze(cardCloze)[0]?.question}</p>
                  <p className="text-xs text-success">→ {parseCloze(cardCloze)[0]?.answer}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-1.5">
          <Label>Explication (optionnel)</Label>
          <Textarea placeholder="Contexte ou explication supplémentaire..." value={cardExplanation} onChange={(e) => setCardExplanation(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSaveCard} className="flex-1 rounded-xl font-semibold"
            disabled={cardType === "qr" ? !cardFront.trim() || !cardBack.trim() : !cardCloze.trim()}>
            {editingCard ? "Enregistrer" : "Créer la carte"}
          </Button>
          <Button variant="secondary" onClick={() => { setView("deck-detail"); resetCardForm(); }} className="rounded-xl">
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  // ─── REVIEW MODE ─────────────────────────────────
  if (view === "review" && reviewCards.length > 0) {
    const card = reviewCards[reviewIndex];
    const displayFront = card.card_type === "cloze" && card.cloze_text
      ? parseCloze(card.cloze_text)[0]?.question || card.front
      : card.front;
    const displayBack = card.card_type === "cloze" && card.cloze_text
      ? parseCloze(card.cloze_text)[0]?.answer || card.back
      : card.back;

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setView("deck-detail")}>
            <X className="h-4 w-4 mr-1" /> Quitter
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {reviewIndex + 1}/{reviewCards.length}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ⏱ {Math.round((Date.now() - reviewStartTime) / 1000)}s
            </span>
          </div>
        </div>

        {/* Progress */}
        <Progress value={((reviewIndex + 1) / reviewCards.length) * 100} className="h-1.5" />

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${card.id}-${isFlipped}`}
            initial={{ opacity: 0, rotateY: isFlipped ? 90 : 0, scale: 0.95 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => !isFlipped && setIsFlipped(true)}
            className="rounded-2xl border border-border bg-card p-8 sm:p-12 min-h-[300px] flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition-shadow select-none"
          >
            {!isFlipped ? (
              <div className="text-center space-y-4">
                <Badge variant="outline" className="text-xs">Question</Badge>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground leading-relaxed">{displayFront}</h3>
                <p className="text-sm text-muted-foreground animate-pulse">Clique ou appuie sur Espace ⎵</p>
              </div>
            ) : (
              <div className="text-center space-y-4 w-full">
                <Badge variant="outline" className="text-xs border-success text-success">Réponse</Badge>
                <div className="text-base sm:text-lg text-foreground whitespace-pre-line leading-relaxed">{displayBack}</div>
                {card.explanation && (
                  <div className="rounded-lg bg-muted/50 p-3 mt-4 text-left">
                    <p className="text-xs text-muted-foreground">{card.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Rating buttons */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-2"
          >
            {[
              { key: "again", label: "À revoir", sub: "<1 min", icon: <RotateCcw className="h-4 w-4" />, color: "border-destructive/40 hover:bg-destructive/10 text-destructive" },
              { key: "hard", label: "Difficile", sub: "1-2j", icon: <span>😓</span>, color: "border-warning/40 hover:bg-warning/10 text-warning" },
              { key: "good", label: "Correct", sub: "3-4j", icon: <span>😊</span>, color: "border-success/40 hover:bg-success/10 text-success" },
              { key: "easy", label: "Facile", sub: "7+j", icon: <span>🎯</span>, color: "border-primary/40 hover:bg-primary/10 text-primary" },
            ].map((btn) => (
              <Button
                key={btn.key}
                variant="outline"
                className={`flex flex-col py-3 h-auto ${btn.color}`}
                onClick={() => rateReviewCard(btn.key)}
              >
                {btn.icon}
                <span className="text-xs font-semibold mt-1">{btn.label}</span>
                <span className="text-[10px] text-muted-foreground">{btn.sub}</span>
              </Button>
            ))}
          </motion.div>
        )}

        {/* Keyboard hints */}
        <p className="text-center text-[10px] text-muted-foreground">
          Raccourcis : Espace = révéler · 1 = À revoir · 2 = Difficile · 3 = Correct · 4 = Facile
        </p>
      </div>
    );
  }

  // ─── REVIEW RESULT ───────────────────────────────
  if (view === "review-result") {
    const elapsed = Math.round((Date.now() - reviewStartTime) / 1000);
    const counts = {
      again: Object.values(reviewRatings).filter(r => r === "again").length,
      hard: Object.values(reviewRatings).filter(r => r === "hard").length,
      good: Object.values(reviewRatings).filter(r => r === "good").length,
      easy: Object.values(reviewRatings).filter(r => r === "easy").length,
    };
    const goodTotal = counts.good + counts.easy;

    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-10">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="text-6xl mb-4">{goodTotal === reviewCards.length ? "🎉" : "📊"}</div>
          <h2 className="text-2xl font-bold text-foreground">Session terminée !</h2>
          <p className="text-muted-foreground mt-2">
            {goodTotal}/{reviewCards.length} cartes maîtrisées en {elapsed}s
          </p>
          <Progress value={(goodTotal / reviewCards.length) * 100} className="h-3 mt-4" />

          <div className="grid grid-cols-4 gap-2 mt-6 text-sm">
            {[
              { label: "À revoir", count: counts.again, color: "bg-destructive/10 text-destructive" },
              { label: "Difficile", count: counts.hard, color: "bg-warning/10 text-warning" },
              { label: "Correct", count: counts.good, color: "bg-success/10 text-success" },
              { label: "Facile", count: counts.easy, color: "bg-primary/10 text-primary" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-3 ${s.color}`}>
                <p className="text-xl font-bold">{s.count}</p>
                <p className="text-[10px]">{s.label}</p>
              </div>
            ))}
          </div>

          {goodTotal === reviewCards.length && (
            <p className="mt-4 text-sm text-success font-medium">🔥 Parfait ! Tu maîtrises toutes les cartes !</p>
          )}
        </motion.div>

        <div className="flex gap-2 justify-center">
          <Button onClick={() => { setView("deck-detail"); fetchDecks(); if (selectedDeck) fetchCards(selectedDeck.id); }}>
            Retour au deck
          </Button>
          <Button variant="secondary" onClick={() => { setView("decks"); setSelectedDeck(null); fetchDecks(); }}>
            Tous les decks
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
