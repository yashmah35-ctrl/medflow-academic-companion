import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subjectColorMap, type SubjectColor } from "@/data/mockData";
import {
  AlertTriangle, ArrowLeft, BookOpen, Brain, Calendar, CheckCircle2,
  Filter, Flame, Search, Sparkles, Target,
  TrendingUp, X, Zap, Clock, ChevronRight, Play,
  Timer, Trophy, BarChart3, ShieldAlert
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ===================== TYPES =====================
interface DBError {
  id: string;
  question: string;
  wrong_answer: string;
  correct_answer: string;
  occurrence_count: number;
  last_seen: string;
  created_at: string;
  subject_name: string | null;
  course_id: string | null;
  error_type: string | null;
  personal_notes: string | null;
  mastered: boolean;
  next_review: string | null;
  correction_count: number;
  source: string;
  mastery_score: number;
  consecutive_wrong: number;
  total_attempts: number;
  last_response_time_ms: number | null;
  is_critical: boolean;
}

interface SubjectGroup {
  name: string;
  color: SubjectColor;
  errors: DBError[];
  criticalCount: number;
  masteredCount: number;
  bySource: { kholle: DBError[]; exam: DBError[]; annale: DBError[] };
}

// ===================== CONSTANTS =====================
const errorReasons = [
  { id: "comprehension", label: "Mauvaise compréhension", icon: "🧠" },
  { id: "memorisation", label: "Manque de mémorisation", icon: "📚" },
  { id: "piege", label: "Piège de formulation", icon: "🪤" },
  { id: "inattention", label: "Erreur d'inattention", icon: "👀" },
];

function getMasteryStatus(err: DBError): "new" | "learning" | "mastered" {
  if (err.mastery_score >= 85 || err.mastered) return "mastered";
  if (err.total_attempts > 0) return "learning";
  return "new";
}

function getMasteryColor(score: number): string {
  if (score >= 85) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

function getIntervalLabel(score: number): string {
  if (score < 30) return "1 min";
  if (score < 50) return "5 min";
  if (score < 70) return "10 min";
  if (score < 85) return "1 jour";
  return "3 jours";
}

function getSeverity(err: DBError): "critical" | "medium" | "light" | "mastered" {
  if (err.mastered || err.mastery_score >= 85) return "mastered";
  if (err.is_critical || err.consecutive_wrong >= 3 || (err.mastery_score < 30 && err.total_attempts >= 5)) return "critical";
  if (err.occurrence_count >= 2 || err.mastery_score < 50) return "medium";
  return "light";
}

const severityConfig = {
  critical: { color: "bg-destructive/10 border-destructive/30 text-destructive", dot: "bg-destructive", label: "Critique" },
  medium: { color: "bg-warning/10 border-warning/30 text-warning", dot: "bg-warning", label: "Moyenne" },
  light: { color: "bg-info/10 border-info/30 text-info", dot: "bg-info", label: "Légère" },
  mastered: { color: "bg-success/10 border-success/30 text-success", dot: "bg-success", label: "Maîtrisée" },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

// ===================== HELPERS =====================
function guessSubjectColor(name: string | null): SubjectColor {
  if (!name) return "chemistry";
  const n = name.toLowerCase();
  if (n.includes("chimie") || n.includes("biochimie")) return "chemistry";
  if (n.includes("bio cell") || n.includes("biologie cellulaire")) return "cellbio";
  if (n.includes("biophysique")) return "biophysics";
  if (n.includes("anatomie")) return "anatomy";
  if (n.includes("histologie") || n.includes("embryologie")) return "histology";
  if (n.includes("physiologie")) return "physiology";
  if (n.includes("pharmacologie")) return "pharmacology";
  if (n.includes("bio mol") || n.includes("biologie moléculaire") || n.includes("génétique")) return "biomolgen";
  if (n.includes("shs")) return "shs";
  if (n.includes("biostatistique")) return "biostatistique";
  if (n.includes("médicament")) return "medicament";
  if (n.includes("santé publique")) return "santepublique";
  if (n.includes("microbiologie")) return "microbiologie";
  if (n.includes("spécialité")) return "specialite";
  return "chemistry";
}

function normalizeSubjectName(name: string, subjectNames: string[]): string {
  if (subjectNames.includes(name)) return name;
  const n = name.toLowerCase();
  for (const sn of subjectNames) { if (sn.toLowerCase() === n) return sn; }
  const keywordMap: { keywords: string[]; suffix?: string }[] = [
    { keywords: ["chimie", "biochimie"], suffix: "Chimie / Biochimie OS" },
    { keywords: ["biologie cellulaire", "bio cell"], suffix: "Biologie Cellulaire OS" },
    { keywords: ["biophysique"], suffix: "Biophysique OS" },
    { keywords: ["anatomie"], suffix: "Anatomie OS" },
    { keywords: ["histologie", "embryologie"], suffix: "Histologie - Embryologie TC" },
    { keywords: ["physiologie"], suffix: "Physiologie TC" },
    { keywords: ["biologie moléculaire", "bio mol"], suffix: "Biologie Moléculaire Génétique TC" },
    { keywords: ["shs"], suffix: "SHS TC" },
    { keywords: ["biostatistique"], suffix: "Biostatistique OS" },
    { keywords: ["médicament"], suffix: "Médicament OS" },
    { keywords: ["santé publique"], suffix: "Santé Publique OS" },
    { keywords: ["microbiologie"], suffix: "Microbiologie TC" },
    { keywords: ["spécialité"], suffix: "Spécialité Médecine" },
  ];
  for (const mapping of keywordMap) {
    if (mapping.keywords.some((kw) => n.includes(kw))) {
      const match = subjectNames.find((sn) => sn === mapping.suffix);
      if (match) return match;
      const fallback = subjectNames.find((sn) => mapping.keywords.some((kw) => sn.toLowerCase().includes(kw)));
      if (fallback) return fallback;
    }
  }
  return name;
}

// ===================== MAIN COMPONENT =====================
export default function ErrorNotebook() {
  const { user } = useAuth();
  const [errors, setErrors] = useState<DBError[]>([]);
  const [subjectNames, setSubjectNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [tab, setTab] = useState("active");
  const [filterType, setFilterType] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "kholle" | "exam" | "annale">("all");
  
  // Review session state
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewCards, setReviewCards] = useState<DBError[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [cardStartTime, setCardStartTime] = useState<number>(0);
  const [sessionResults, setSessionResults] = useState<{ correct: number; wrong: number; total: number } | null>(null);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer for session
  useEffect(() => {
    if (!reviewMode || sessionResults) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [reviewMode, sessionStartTime, sessionResults]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from("subjects").select("name").order("name");
      if (data) setSubjectNames(data.map((s) => s.name));
    };
    fetchSubjects();
  }, []);

  // Fetch errors
  useEffect(() => {
    if (!user) return;
    const fetchErrors = async () => {
      const { data, error } = await supabase
        .from("errors")
        .select("*")
        .eq("user_id", user.id)
        .order("last_seen", { ascending: false });
      if (data) setErrors(data as unknown as DBError[]);
      if (error) console.error(error);
      setLoading(false);
    };
    fetchErrors();
  }, [user]);

  // Group errors by subject
  const subjectGroups = useMemo(() => {
    const groups: Record<string, SubjectGroup> = {};
    subjectNames.forEach((sn) => {
      groups[sn] = { name: sn, color: guessSubjectColor(sn), errors: [], criticalCount: 0, masteredCount: 0, bySource: { kholle: [], exam: [], annale: [] } };
    });
    errors.forEach((err) => {
      const name = normalizeSubjectName(err.subject_name || "Autre", subjectNames);
      if (!groups[name]) {
        groups[name] = { name, color: guessSubjectColor(name), errors: [], criticalCount: 0, masteredCount: 0, bySource: { kholle: [], exam: [], annale: [] } };
      }
      groups[name].errors.push(err);
      if (err.is_critical || err.consecutive_wrong >= 3) groups[name].criticalCount++;
      if (err.mastered || err.mastery_score >= 85) groups[name].masteredCount++;
      const source = err.source || "kholle";
      if (source === "exam") groups[name].bySource.exam.push(err);
      else if (source === "annale") groups[name].bySource.annale.push(err);
      else groups[name].bySource.kholle.push(err);
    });
    return Object.values(groups).sort((a, b) => {
      if (b.errors.length !== a.errors.length) return b.errors.length - a.errors.length;
      return a.name.localeCompare(b.name);
    });
  }, [errors, subjectNames]);

  // Stats
  const totalErrors = errors.length;
  const criticalErrors = errors.filter((e) => e.is_critical || e.consecutive_wrong >= 3).length;
  const masteredErrors = errors.filter((e) => e.mastered || e.mastery_score >= 85).length;
  const todayReview = errors.filter((e) => {
    if (e.mastered || e.mastery_score >= 85) return false;
    if (!e.next_review) return e.total_attempts === 0 || e.mastery_score < 70;
    return new Date(e.next_review) <= new Date();
  }).length;
  const correctionRate = totalErrors > 0 ? Math.round((masteredErrors / totalErrors) * 100) : 0;
  const weakSubjects = subjectGroups.filter((g) => g.errors.length > 2 && g.masteredCount / g.errors.length < 0.5).slice(0, 3).map((g) => g.name);

  // Filtered errors for subject detail
  const filteredErrors = useMemo(() => {
    if (!selectedSubject) return [];
    const group = subjectGroups.find((g) => g.name === selectedSubject);
    if (!group) return [];
    let list = sourceFilter === "all" ? group.errors : sourceFilter === "kholle" ? group.bySource.kholle : sourceFilter === "exam" ? group.bySource.exam : group.bySource.annale;
    if (tab === "active") list = list.filter((e) => !e.mastered && e.mastery_score < 85);
    else if (tab === "review") list = list.filter((e) => {
      if (e.mastered || e.mastery_score >= 85) return false;
      if (!e.next_review) return true;
      return new Date(e.next_review) <= new Date();
    });
    else if (tab === "mastered") list = list.filter((e) => e.mastered || e.mastery_score >= 85);
    if (filterType !== "all") list = list.filter((e) => e.error_type === filterType);
    if (search) list = list.filter((e) => e.question.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [selectedSubject, subjectGroups, tab, filterType, search, sourceFilter]);

  // ==================== ACTIONS ====================
  const updateError = async (errId: string, updates: Partial<DBError>) => {
    await supabase.from("errors").update(updates as any).eq("id", errId);
    setErrors((prev) => prev.map((e) => (e.id === errId ? { ...e, ...updates } : e)));
  };


  const openError = (err: DBError) => {
    startReviewSession([err], 1);
  };

  // Helper to shuffle options for a card
  const shuffleOptionsForCard = (card: DBError) => {
    const options = [card.correct_answer, card.wrong_answer];
    // Fisher-Yates shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    setShuffledOptions(options);
  };

  const startReviewSession = (errs: DBError[], maxCards = 10) => {
    const sorted = [...errs]
      .filter(e => !e.mastered && e.mastery_score < 85)
      .sort((a, b) => {
        if (a.is_critical !== b.is_critical) return a.is_critical ? -1 : 1;
        return a.mastery_score - b.mastery_score;
      })
      .slice(0, maxCards);
    if (sorted.length === 0) { toast.info("Aucune carte à réviser !"); return; }
    setReviewCards(sorted);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setUserAnswer(null);
    setSessionResults(null);
    setSessionCorrectCount(0);
    setSessionStartTime(Date.now());
    setCardStartTime(Date.now());
    setElapsedSeconds(0);
    setReviewMode(true);
    shuffleOptionsForCard(sorted[0]);
  };

  const handleSelectAnswer = async (selected: string) => {
    const card = reviewCards[currentCardIndex];
    const correct = selected === card.correct_answer;
    const responseTime = Date.now() - cardStartTime;
    
    setUserAnswer(selected);
    setShowAnswer(true);
    
    let scoreDelta = 0;
    if (!correct) {
      scoreDelta = -20;
    } else if (responseTime < 5000) {
      scoreDelta = 15;
    } else if (responseTime > 10000) {
      scoreDelta = 8;
    } else {
      scoreDelta = 5;
    }
    
    const newScore = Math.max(0, Math.min(100, card.mastery_score + scoreDelta));
    const newConsWrong = correct ? 0 : card.consecutive_wrong + 1;
    const newAttempts = card.total_attempts + 1;
    const isCritical = newConsWrong >= 3 || (newScore < 30 && newAttempts >= 5);
    const isMastered = newScore >= 85;
    
    let nextReviewMs = 60000;
    if (newScore >= 30) nextReviewMs = 5 * 60000;
    if (newScore >= 50) nextReviewMs = 10 * 60000;
    if (newScore >= 70) nextReviewMs = 24 * 3600000;
    if (newScore >= 85) nextReviewMs = 3 * 24 * 3600000;
    
    const nextReview = new Date(Date.now() + nextReviewMs).toISOString();
    
    await updateError(card.id, {
      mastery_score: newScore,
      consecutive_wrong: newConsWrong,
      total_attempts: newAttempts,
      last_response_time_ms: responseTime,
      is_critical: isCritical,
      mastered: isMastered,
      next_review: nextReview,
      last_seen: new Date().toISOString(),
    });

    setReviewCards(prev => prev.map((c, i) => i === currentCardIndex ? { ...c, mastery_score: newScore, consecutive_wrong: newConsWrong, total_attempts: newAttempts, is_critical: isCritical, mastered: isMastered } : c));
    
    if (correct) setSessionCorrectCount(prev => prev + 1);
  };

  const goToNextCard = () => {
    if (currentCardIndex < reviewCards.length - 1) {
      const nextIdx = currentCardIndex + 1;
      setCurrentCardIndex(nextIdx);
      setShowAnswer(false);
      setUserAnswer(null);
      setCardStartTime(Date.now());
      shuffleOptionsForCard(reviewCards[nextIdx]);
    } else {
      setSessionResults({
        correct: sessionCorrectCount,
        wrong: reviewCards.length - sessionCorrectCount,
        total: reviewCards.length,
      });
    }
  };

  const exitReviewMode = () => {
    setReviewMode(false);
    setReviewCards([]);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setUserAnswer(null);
    setSessionResults(null);
    setSessionCorrectCount(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // ==================== REVIEW SESSION MODE ====================
  if (reviewMode) {
    if (sessionResults) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center space-y-6 py-12">
          <Trophy className="h-16 w-16 text-warning mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Session terminée !</h2>
          <p className="text-muted-foreground">Tu as révisé {reviewCards.length} carte{reviewCards.length > 1 ? "s" : ""} en {formatTime(elapsedSeconds)}</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-2xl font-bold text-success">{reviewCards.filter(c => c.mastery_score >= 50).length}</p>
              <p className="text-xs text-muted-foreground">En progrès</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-2xl font-bold text-destructive">{reviewCards.filter(c => c.is_critical).length}</p>
              <p className="text-xs text-muted-foreground">Critiques</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-2xl font-bold text-primary">{reviewCards.filter(c => c.mastered).length}</p>
              <p className="text-xs text-muted-foreground">Maîtrisées</p>
            </div>
          </div>
          <Button onClick={exitReviewMode} className="rounded-xl px-8">Fermer</Button>
        </motion.div>
      );
    }

    const card = reviewCards[currentCardIndex];
    const severity = getSeverity(card);
    const config = severityConfig[severity];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-4">
        {/* Session header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={exitReviewMode} className="gap-1.5">
            <X className="h-4 w-4" /> Quitter
          </Button>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Timer className="h-4 w-4" /> {formatTime(elapsedSeconds)}
            </span>
            <span className="text-muted-foreground font-medium">{currentCardIndex + 1} / {reviewCards.length}</span>
          </div>
        </div>

        {/* Progress */}
        <Progress value={((currentCardIndex + 1) / reviewCards.length) * 100} className="h-2" />

        {/* Card */}
        <motion.div
          key={card.id + currentCardIndex}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-border bg-card p-6 space-y-5 min-h-[300px] flex flex-col"
        >
          {/* Badge row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${config.color} border text-xs`} variant="outline">
              <span className={`h-2 w-2 rounded-full ${config.dot} mr-1.5 inline-block`} />
              {config.label}
            </Badge>
            <Badge variant="secondary" className="text-xs">{card.subject_name || "Autre"}</Badge>
            {card.error_type && (
              <span className="text-xs text-muted-foreground">
                {errorReasons.find(r => r.id === card.error_type)?.icon} {errorReasons.find(r => r.id === card.error_type)?.label}
              </span>
            )}
          </div>

          {/* Question */}
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg font-semibold text-foreground text-center">{card.question}</p>
          </div>

          {/* Answer propositions or result */}
          {!showAnswer ? (
            <div className="space-y-2">
              {shuffledOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(option)}
                  className="w-full rounded-xl border border-border bg-muted/30 hover:bg-muted/60 p-4 text-left text-sm font-medium text-foreground transition-all hover:border-primary/40"
                >
                  <span className="text-muted-foreground mr-2 font-bold">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`rounded-xl p-3 ${userAnswer === card.correct_answer ? "bg-success/5 border border-success/15" : "bg-destructive/5 border border-destructive/15"}`}>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {userAnswer === card.correct_answer ? <CheckCircle2 className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-destructive" />} Ta réponse
                  </span>
                  <p className="text-foreground mt-1 font-medium text-sm">{userAnswer}</p>
                </div>
                <div className="rounded-xl bg-success/5 border border-success/15 p-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> Bonne réponse</span>
                  <p className="text-foreground mt-1 font-medium text-sm">{card.correct_answer}</p>
                </div>
              </div>

              {/* Mastery indicator */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Score maîtrise : <span className={`font-bold ${getMasteryColor(card.mastery_score)}`}>{card.mastery_score}/100</span></span>
                <span>·</span>
                <span>Prochaine révision : {getIntervalLabel(card.mastery_score)}</span>
              </div>

              {/* Next button */}
              <Button onClick={goToNextCard} className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                {currentCardIndex < reviewCards.length - 1 ? "Carte suivante →" : "Terminer la session"}
              </Button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }



  // ==================== SUBJECT DETAIL VIEW (DECK STYLE) ====================
  if (selectedSubject) {
    const group = subjectGroups.find((g) => g.name === selectedSubject);
    const colors = group ? subjectColorMap[group.color] : subjectColorMap.chemistry;
    const subjectTotal = group?.errors.length || 0;
    const subjectMastered = group?.masteredCount || 0;
    const subjectRate = subjectTotal > 0 ? Math.round((subjectMastered / subjectTotal) * 100) : 0;
    const newCards = group?.errors.filter(e => getMasteryStatus(e) === "new").length || 0;
    const learningCards = group?.errors.filter(e => getMasteryStatus(e) === "learning").length || 0;
    const masteredCards = group?.errors.filter(e => getMasteryStatus(e) === "mastered").length || 0;
    const criticalCards = group?.errors.filter(e => e.is_critical || e.consecutive_wrong >= 3).length || 0;
    const todayCards = group?.errors.filter(e => {
      if (e.mastered || e.mastery_score >= 85) return false;
      if (!e.next_review) return true;
      return new Date(e.next_review) <= new Date();
    }).length || 0;

    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedSubject(null); setTab("active"); setFilterType("all"); setSearch(""); setSourceFilter("all"); }} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>

        {/* Subject header */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Algorithme d'apprentissage : <span className="text-primary font-medium">Répétition adaptative ⓘ</span></p>
          
          {/* Deck-style hero card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-6 space-y-4 mt-2">
            <div className="text-center space-y-1">
              <p className="text-5xl font-bold text-foreground">{todayCards}</p>
              <p className="text-sm text-muted-foreground">cartes pour aujourd'hui</p>
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-md bg-primary/20 flex items-center justify-center">
                  <Zap className="h-3 w-3 text-primary" />
                </div>
                <span className="font-bold text-foreground">{newCards}</span>
                <span className="text-muted-foreground">À étudier</span>
              </div>
              <div className="h-5 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-md bg-warning/20 flex items-center justify-center">
                  <Clock className="h-3 w-3 text-warning" />
                </div>
                <span className="font-bold text-foreground">{learningCards}</span>
                <span className="text-muted-foreground">En cours</span>
              </div>
              <div className="h-5 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 rounded-md bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                </div>
                <span className="font-bold text-foreground">{masteredCards}</span>
                <span className="text-muted-foreground">Maîtrisées</span>
              </div>
            </div>

            <Button 
              onClick={() => group && startReviewSession(group.errors)} 
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
              disabled={todayCards === 0}
            >
              <Play className="h-5 w-5 mr-2" /> Étudier les cartes
            </Button>
          </motion.div>
        </div>

        {/* Quick session button */}
        {criticalCards > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-foreground">{criticalCards} erreur{criticalCards > 1 ? "s" : ""} critique{criticalCards > 1 ? "s" : ""}</p>
                <p className="text-xs text-muted-foreground">Session rapide 5-7 min recommandée</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => group && startReviewSession(group.errors.filter(e => e.is_critical || e.consecutive_wrong >= 3), 10)}>
              <Flame className="h-4 w-4 mr-1.5" /> Corriger maintenant
            </Button>
          </motion.div>
        )}

        {/* Cards list header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">Cartes du paquet ({subjectTotal})</h3>
          </div>
          
          {/* Mastery distribution bar */}
          {subjectTotal > 0 && (
            <div className="space-y-1.5">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
                {newCards > 0 && <div className="h-full bg-muted-foreground/30" style={{ width: `${(newCards / subjectTotal) * 100}%` }} />}
                {learningCards > 0 && <div className="h-full bg-warning" style={{ width: `${(learningCards / subjectTotal) * 100}%` }} />}
                {masteredCards > 0 && <div className="h-full bg-success" style={{ width: `${(masteredCards / subjectTotal) * 100}%` }} />}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" />{newCards} À étudier</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" />{learningCards} En cours</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" />{masteredCards} Maîtrisées</span>
              </div>
            </div>
          )}
        </div>

        {/* Source filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all" as const, label: "Toutes", count: group?.errors.length || 0 },
            { value: "kholle" as const, label: "Khôlles / Tutorat", count: group?.bySource.kholle.length || 0 },
            { value: "exam" as const, label: "Examens Blancs", count: group?.bySource.exam.length || 0 },
            { value: "annale" as const, label: "Annales", count: group?.bySource.annale.length || 0 },
          ].map((s) => (
            <button key={s.value} onClick={() => setSourceFilter(s.value)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${sourceFilter === s.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted/50"}`}>
              {s.label} ({s.count})
            </button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/50 rounded-xl">
            <TabsTrigger value="active" className="rounded-lg text-xs">Erreurs actives</TabsTrigger>
            <TabsTrigger value="review" className="rounded-lg text-xs">À revoir aujourd'hui</TabsTrigger>
            <TabsTrigger value="mastered" className="rounded-lg text-xs">Maîtrisées</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher une erreur…" className="pl-9 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Type d'erreur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {errorReasons.map((r) => (<SelectItem key={r.id} value={r.id}>{r.icon} {r.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* Error cards grid */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-3" variants={container} initial="hidden" animate="show">
          {filteredErrors.map((err) => {
            const severity = getSeverity(err);
            const config = severityConfig[severity];

            return (
              <motion.div key={err.id} variants={item} onClick={() => openError(err)}
                className="rounded-2xl border border-border bg-card hover:bg-card/80 p-4 space-y-3 cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
                    <Badge className={`${config.color} border text-xs`} variant="outline">{config.label}</Badge>
                    <span className="text-xs text-muted-foreground">×{err.occurrence_count}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground text-sm line-clamp-2">{err.question}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {err.error_type && (
                      <span>{errorReasons.find((r) => r.id === err.error_type)?.icon} {errorReasons.find((r) => r.id === err.error_type)?.label}</span>
                    )}
                  </div>
                  {/* Mini mastery bar */}
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${err.mastery_score >= 85 ? "bg-success" : err.mastery_score >= 50 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${err.mastery_score}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold ${getMasteryColor(err.mastery_score)}`}>{err.mastery_score}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredErrors.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success/50" />
            <p className="font-medium">{tab === "mastered" ? "Aucune erreur maîtrisée pour l'instant" : "Aucune erreur dans cette catégorie 🎉"}</p>
          </div>
        )}

        {/* Per-subject stats */}
        {subjectTotal > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Statistiques</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{subjectRate}%</p>
                <p className="text-xs text-muted-foreground">Taux correction</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{criticalCards}</p>
                <p className="text-xs text-muted-foreground">Erreurs critiques</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{subjectTotal}</p>
                <p className="text-xs text-muted-foreground">Total erreurs</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold text-warning">{group?.errors.reduce((acc, e) => acc + e.total_attempts, 0) || 0}</p>
                <p className="text-xs text-muted-foreground">Tentatives</p>
              </div>
            </div>

            {/* Mastery distribution */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Distribution des scores de maîtrise</p>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { label: "0-20", count: group?.errors.filter(e => e.mastery_score < 20).length || 0, color: "bg-destructive" },
                  { label: "20-40", count: group?.errors.filter(e => e.mastery_score >= 20 && e.mastery_score < 40).length || 0, color: "bg-destructive/70" },
                  { label: "40-60", count: group?.errors.filter(e => e.mastery_score >= 40 && e.mastery_score < 60).length || 0, color: "bg-warning" },
                  { label: "60-80", count: group?.errors.filter(e => e.mastery_score >= 60 && e.mastery_score < 80).length || 0, color: "bg-warning/70" },
                  { label: "80-100", count: group?.errors.filter(e => e.mastery_score >= 80).length || 0, color: "bg-success" },
                ].map(b => (
                  <div key={b.label} className="text-center space-y-1">
                    <div className="h-16 rounded-lg bg-muted/30 relative overflow-hidden flex items-end justify-center">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${subjectTotal > 0 ? (b.count / subjectTotal) * 100 : 0}%` }}
                        transition={{ duration: 0.5 }} className={`w-full rounded-t-md ${b.color}`} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{b.label}</p>
                    <p className="text-[10px] font-bold text-foreground">{b.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ==================== MAIN DASHBOARD VIEW ====================
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mon Cahier d'Erreurs</h1>
        <p className="text-muted-foreground mt-1">Micro-flashcards adaptatives avec algorithme de maîtrise intelligent.</p>
      </div>

      {/* Stats Bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center"><Flame className="h-4 w-4 text-destructive" /></div>
            <span className="text-xs text-muted-foreground">À revoir aujourd'hui</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{todayReview}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-success" /></div>
            <span className="text-xs text-muted-foreground">Taux de correction</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{correctionRate}%</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-warning" /></div>
            <span className="text-xs text-muted-foreground">Erreurs critiques</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{criticalErrors}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Target className="h-4 w-4 text-primary" /></div>
            <span className="text-xs text-muted-foreground">Points faibles</span>
          </div>
          <p className="text-sm font-semibold text-foreground line-clamp-1">{weakSubjects.length > 0 ? weakSubjects.join(", ") : "Aucun 🎉"}</p>
        </div>
      </motion.div>

      {/* Quick session CTA */}
      {criticalErrors > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-gradient-to-r from-destructive/10 to-warning/10 border border-destructive/20 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Flame className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Corriger mes {Math.min(criticalErrors, 10)} erreurs critiques maintenant</p>
              <p className="text-xs text-muted-foreground">Session rapide 5-7 min</p>
            </div>
          </div>
          <Button size="sm" className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shrink-0"
            onClick={() => startReviewSession(errors.filter(e => e.is_critical || e.consecutive_wrong >= 3), 10)}>
            <Play className="h-4 w-4 mr-1.5" /> Go
          </Button>
        </motion.div>
      )}

      {/* Motivation banner */}
      {masteredErrors > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-gradient-to-r from-success/10 to-primary/10 border border-success/20 p-4 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-success shrink-0" />
          <p className="text-sm text-foreground">
            Tu as maîtrisé <span className="font-bold">{masteredErrors} erreur{masteredErrors > 1 ? "s" : ""}</span> 🔥
            {totalErrors - masteredErrors > 0 && (<> · Encore <span className="font-bold">{totalErrors - masteredErrors}</span> à corriger</>)}
          </p>
        </motion.div>
      )}

      {/* Subject Cards */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Par matière</h2>
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" variants={container} initial="hidden" animate="show">
          {subjectGroups.map((group) => {
            const colors = subjectColorMap[group.color] || subjectColorMap.chemistry;
            const rate = group.errors.length > 0 ? Math.round((group.masteredCount / group.errors.length) * 100) : 0;
            return (
              <motion.div key={group.name} variants={item} onClick={() => setSelectedSubject(group.name)}
                className={`rounded-2xl border border-border ${colors.light} p-5 cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 space-y-3`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm">{group.name}</h3>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>→ {group.errors.length} erreur{group.errors.length > 1 ? "s" : ""}</p>
                  <p>→ {group.criticalCount} critique{group.criticalCount > 1 ? "s" : ""}</p>
                  <p>→ {rate}% corrigées</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {group.bySource.kholle.length > 0 && (<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Khôlles: {group.bySource.kholle.length}</Badge>)}
                  {group.bySource.exam.length > 0 && (<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">EB: {group.bySource.exam.length}</Badge>)}
                  {group.bySource.annale.length > 0 && (<Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Annales: {group.bySource.annale.length}</Badge>)}
                </div>
                <Progress value={rate} className="h-1.5" />
              </motion.div>
            );
          })}
        </motion.div>

        {subjectGroups.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Zap className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="font-medium">Aucune erreur enregistrée</p>
            <p className="text-sm mt-1">Continue à t'entraîner pour remplir ton cahier d'erreurs !</p>
          </div>
        )}
      </div>
    </div>
  );
}
