import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subjectColorMap, type SubjectColor } from "@/data/mockData";
import {
  AlertTriangle, ArrowLeft, BookOpen, Brain, Calendar, CheckCircle2,
  Filter, Flame, Lightbulb, RotateCcw, Search, Sparkles, Target,
  TrendingUp, X, Zap, StickyNote, Clock, ChevronRight
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
}

interface SubjectGroup {
  name: string;
  color: SubjectColor;
  errors: DBError[];
  criticalCount: number;
  masteredCount: number;
  bySource: {
    kholle: DBError[];
    exam: DBError[];
    annale: DBError[];
  };
}

const errorReasons = [
  { id: "comprehension", label: "Mauvaise compréhension", icon: "🧠" },
  { id: "memorisation", label: "Manque de mémorisation", icon: "📚" },
  { id: "piege", label: "Piège de formulation", icon: "🪤" },
  { id: "inattention", label: "Erreur d'inattention", icon: "👀" },
];

function getSeverity(err: DBError): "critical" | "medium" | "light" | "mastered" {
  if (err.mastered) return "mastered";
  if (err.occurrence_count >= 4) return "critical";
  if (err.occurrence_count >= 2) return "medium";
  return "light";
}

const severityConfig = {
  critical: { color: "bg-destructive/10 border-destructive/30 text-destructive", dot: "bg-destructive", label: "Critique" },
  medium: { color: "bg-warning/10 border-warning/30 text-warning", dot: "bg-warning", label: "Moyenne" },
  light: { color: "bg-info/10 border-info/30 text-info", dot: "bg-info", label: "Légère" },
  mastered: { color: "bg-success/10 border-success/30 text-success", dot: "bg-success", label: "Maîtrisée" },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

// Color mapping from subject_name to SubjectColor
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

// Normalize short/inconsistent subject names to official subject names
function normalizeSubjectName(name: string, subjectNames: string[]): string {
  // If it already matches a real subject name exactly, return it
  if (subjectNames.includes(name)) return name;

  const n = name.toLowerCase();

  // Try to find the best matching subject from the DB
  // Priority: exact inclusion match, then keyword match
  for (const sn of subjectNames) {
    if (sn.toLowerCase() === n) return sn;
  }

  // Keyword-based matching for legacy short names
  const keywordMap: { keywords: string[]; excludeKeywords?: string[]; suffix?: string }[] = [
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
      // Check if the mapped name exists in actual subjects
      const match = subjectNames.find((sn) => sn === mapping.suffix);
      if (match) return match;
      // Fallback: find any subject containing the keyword
      const fallback = subjectNames.find((sn) =>
        mapping.keywords.some((kw) => sn.toLowerCase().includes(kw))
      );
      if (fallback) return fallback;
    }
  }

  return name;
}

export default function ErrorNotebook() {
  const { user } = useAuth();
  const [errors, setErrors] = useState<DBError[]>([]);
  const [subjectNames, setSubjectNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<DBError | null>(null);
  const [tab, setTab] = useState("active");
  const [filterType, setFilterType] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "kholle" | "exam" | "annale">("all");
  const [personalNote, setPersonalNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Fetch subjects list for name normalization
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from("subjects").select("name").order("name");
      if (data) setSubjectNames(data.map((s) => s.name));
    };
    fetchSubjects();
  }, []);

  // Fetch errors from DB
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

  // Group errors by subject - show ALL subjects (even empty ones)
  const subjectGroups = useMemo(() => {
    const groups: Record<string, SubjectGroup> = {};
    
    // Initialize all subjects from DB as empty groups
    subjectNames.forEach((sn) => {
      groups[sn] = {
        name: sn,
        color: guessSubjectColor(sn),
        errors: [],
        criticalCount: 0,
        masteredCount: 0,
        bySource: { kholle: [], exam: [], annale: [] },
      };
    });
    
    // Add errors to their matching group
    errors.forEach((err) => {
      const rawName = err.subject_name || "Autre";
      const name = normalizeSubjectName(rawName, subjectNames);
      if (!groups[name]) {
        groups[name] = {
          name,
          color: guessSubjectColor(name),
          errors: [],
          criticalCount: 0,
          masteredCount: 0,
          bySource: { kholle: [], exam: [], annale: [] },
        };
      }
      groups[name].errors.push(err);
      if (err.occurrence_count >= 4) groups[name].criticalCount++;
      if (err.mastered) groups[name].masteredCount++;
      
      // Group by source
      const source = err.source || "kholle";
      if (source === "exam") groups[name].bySource.exam.push(err);
      else if (source === "annale") groups[name].bySource.annale.push(err);
      else groups[name].bySource.kholle.push(err);
    });
    
    // Sort: subjects with errors first, then alphabetically
    return Object.values(groups).sort((a, b) => {
      if (b.errors.length !== a.errors.length) return b.errors.length - a.errors.length;
      return a.name.localeCompare(b.name);
    });
  }, [errors, subjectNames]);

  // Stats
  const totalErrors = errors.length;
  const criticalErrors = errors.filter((e) => e.occurrence_count >= 4).length;
  const masteredErrors = errors.filter((e) => e.mastered).length;
  const todayReview = errors.filter((e) => {
    if (!e.next_review) return e.occurrence_count >= 3;
    return new Date(e.next_review) <= new Date();
  }).length;
  const correctionRate = totalErrors > 0 ? Math.round((masteredErrors / totalErrors) * 100) : 0;

  // Weak subjects
  const weakSubjects = subjectGroups
    .filter((g) => g.errors.length > 2 && g.masteredCount / g.errors.length < 0.5)
    .slice(0, 3)
    .map((g) => g.name);

  // Filtered errors for subject detail view
  const filteredErrors = useMemo(() => {
    if (!selectedSubject) return [];
    const group = subjectGroups.find((g) => g.name === selectedSubject);
    if (!group) return [];
    
    // Source filter first
    let list = sourceFilter === "all" ? group.errors 
      : sourceFilter === "kholle" ? group.bySource.kholle
      : sourceFilter === "exam" ? group.bySource.exam
      : group.bySource.annale;

    // Tab filter
    if (tab === "active") list = list.filter((e) => !e.mastered);
    else if (tab === "review") list = list.filter((e) => {
      if (e.mastered) return false;
      if (!e.next_review) return e.occurrence_count >= 3;
      return new Date(e.next_review) <= new Date();
    });
    else if (tab === "mastered") list = list.filter((e) => e.mastered);

    // Type filter
    if (filterType !== "all") list = list.filter((e) => e.error_type === filterType);

    // Search
    if (search) list = list.filter((e) => e.question.toLowerCase().includes(search.toLowerCase()));

    return list;
  }, [selectedSubject, subjectGroups, tab, filterType, search, sourceFilter]);

  // Schedule review
  const scheduleReview = async (errId: string, days: number) => {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + days);
    await supabase
      .from("errors")
      .update({ next_review: nextReview.toISOString() })
      .eq("id", errId);
    setErrors((prev) =>
      prev.map((e) => (e.id === errId ? { ...e, next_review: nextReview.toISOString() } : e))
    );
    toast.success(`Révision planifiée dans ${days} jour${days > 1 ? "s" : ""}`);
  };

  // Set error type
  const setErrorType = async (errId: string, type: string) => {
    await supabase.from("errors").update({ error_type: type }).eq("id", errId);
    setErrors((prev) => prev.map((e) => (e.id === errId ? { ...e, error_type: type } : e)));
    if (selectedError?.id === errId) setSelectedError((prev) => prev ? { ...prev, error_type: type } : null);
  };

  // Save personal note
  const saveNote = async () => {
    if (!selectedError) return;
    setSavingNote(true);
    await supabase.from("errors").update({ personal_notes: personalNote }).eq("id", selectedError.id);
    setErrors((prev) => prev.map((e) => (e.id === selectedError.id ? { ...e, personal_notes: personalNote } : e)));
    setSelectedError((prev) => prev ? { ...prev, personal_notes: personalNote } : null);
    setSavingNote(false);
    toast.success("Notes sauvegardées !");
  };

  // Mark as mastered
  const toggleMastered = async (errId: string) => {
    const err = errors.find((e) => e.id === errId);
    if (!err) return;
    const newVal = !err.mastered;
    await supabase.from("errors").update({ mastered: newVal, correction_count: newVal ? err.correction_count + 1 : err.correction_count }).eq("id", errId);
    setErrors((prev) => prev.map((e) => (e.id === errId ? { ...e, mastered: newVal, correction_count: newVal ? e.correction_count + 1 : e.correction_count } : e)));
    toast.success(newVal ? "Erreur marquée comme maîtrisée ✅" : "Erreur remise en révision");
  };

  // Open error detail
  const openError = (err: DBError) => {
    setSelectedError(err);
    setPersonalNote(err.personal_notes || "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // ==================== ERROR DETAIL MODAL (Focus Mode) ====================
  if (selectedError) {
    const severity = getSeverity(selectedError);
    const config = severityConfig[severity];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-5"
      >
        <Button variant="ghost" size="sm" onClick={() => setSelectedError(null)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>

        <div className="max-w-3xl mx-auto space-y-5">
          {/* Error Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card/95 backdrop-blur-sm p-6 space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${config.color} border text-xs`} variant="outline">
                    <span className={`h-2 w-2 rounded-full ${config.dot} mr-1.5 inline-block`} />
                    {config.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {selectedError.subject_name || "Autre"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">×{selectedError.occurrence_count}</span>
                </div>
                <h2 className="text-lg font-bold text-foreground">{selectedError.question}</h2>
              </div>
              <Button
                variant={selectedError.mastered ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMastered(selectedError.id)}
                className="shrink-0"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {selectedError.mastered ? "Maîtrisée" : "Marquer maîtrisée"}
              </Button>
            </div>

            {/* Answers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-destructive/5 border border-destructive/15 p-4">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <X className="h-3 w-3 text-destructive" /> Ta réponse
                </span>
                <p className="text-foreground mt-1 font-medium">{selectedError.wrong_answer}</p>
              </div>
              <div className="rounded-xl bg-success/5 border border-success/15 p-4">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-success" /> Bonne réponse
                </span>
                <p className="text-foreground mt-1 font-medium">{selectedError.correct_answer}</p>
              </div>
            </div>

            {/* Why did you get it wrong? */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-warning" /> Pourquoi tu t'es trompé ?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {errorReasons.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setErrorType(selectedError.id, reason.id)}
                    className={`rounded-xl border p-3 text-left text-sm transition-all ${
                      selectedError.error_type === reason.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <span className="mr-1.5">{reason.icon}</span> {reason.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Analysis */}
            <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 space-y-1">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-primary" /> Analyse IA
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedError.error_type === "comprehension"
                  ? `L'erreur vient probablement d'une confusion conceptuelle. Revois la définition et les cas limites liés à "${selectedError.question.slice(0, 40)}…".`
                  : selectedError.error_type === "memorisation"
                  ? `Tu as oublié un détail clé. Crée une flashcard dédiée et utilise la répétition espacée pour ancrer cette notion.`
                  : selectedError.error_type === "piege"
                  ? `La formulation de la question contenait un piège. Entraîne-toi à repérer les mots-clés : "toujours", "jamais", "sauf"…`
                  : selectedError.error_type === "inattention"
                  ? `C'est une erreur d'inattention. Prends le temps de relire chaque proposition avant de valider ta réponse.`
                  : `Sélectionne le type d'erreur ci-dessus pour obtenir une analyse personnalisée.`}
              </p>
            </div>

            {/* Personal Notes */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <StickyNote className="h-4 w-4 text-warning" /> Notes personnelles
              </p>
              <Textarea
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="Résumé, astuce mnémotechnique, rappel important…"
                className="min-h-[80px] bg-muted/30"
              />
              <Button size="sm" onClick={saveNote} disabled={savingNote} className="rounded-lg">
                {savingNote ? "Sauvegarde…" : "Sauvegarder"}
              </Button>
            </div>

            {/* Spaced repetition buttons */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-info" /> Planifier la révision
              </p>
              <div className="flex gap-2 flex-wrap">
                {[1, 3, 7, 21].map((d) => (
                  <Button
                    key={d}
                    variant="outline"
                    size="sm"
                    onClick={() => scheduleReview(selectedError.id, d)}
                    className="rounded-xl"
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {d === 1 ? "Demain" : `Dans ${d} jours`}
                  </Button>
                ))}
              </div>
              {selectedError.next_review && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Prochaine révision : {new Date(selectedError.next_review).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ==================== SUBJECT DETAIL VIEW ====================
  if (selectedSubject) {
    const group = subjectGroups.find((g) => g.name === selectedSubject);
    const colors = group ? subjectColorMap[group.color] : subjectColorMap.chemistry;
    const subjectTotal = group?.errors.length || 0;
    const subjectMastered = group?.masteredCount || 0;
    const subjectRate = subjectTotal > 0 ? Math.round((subjectMastered / subjectTotal) * 100) : 0;

    return (
      <div className="space-y-5">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedSubject(null); setTab("active"); setFilterType("all"); setSearch(""); setSourceFilter("all"); }} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedSubject}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {subjectTotal} erreurs · {group?.criticalCount || 0} critiques · {subjectRate}% corrigées
            </p>
          </div>
          <div className="relative">
            <div className="h-14 w-14 flex items-center justify-center">
              <svg width={56} height={56} className="transform -rotate-90">
                <circle cx={28} cy={28} r={24} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
                <circle cx={28} cy={28} r={24} fill="none" stroke={subjectRate >= 70 ? "hsl(var(--success))" : subjectRate >= 40 ? "hsl(var(--warning))" : "hsl(var(--destructive))"} strokeWidth={4} strokeLinecap="round" strokeDasharray={2 * Math.PI * 24} strokeDashoffset={2 * Math.PI * 24 * (1 - subjectRate / 100)} className="transition-all duration-700" />
              </svg>
              <span className="absolute text-xs font-bold text-foreground">{subjectRate}%</span>
            </div>
          </div>
        </div>

        {/* Source filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "all" as const, label: "Toutes", count: group?.errors.length || 0 },
            { value: "kholle" as const, label: "Khôlles / Tutorat", count: group?.bySource.kholle.length || 0 },
            { value: "exam" as const, label: "Examens Blancs", count: group?.bySource.exam.length || 0 },
            { value: "annale" as const, label: "Annales", count: group?.bySource.annale.length || 0 },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => setSourceFilter(s.value)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                sourceFilter === s.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/50"
              }`}
            >
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

        {/* Filters */}
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
              {errorReasons.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.icon} {r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-3" variants={container} initial="hidden" animate="show">
          {filteredErrors.map((err) => {
            const severity = getSeverity(err);
            const config = severityConfig[severity];

            return (
              <motion.div
                key={err.id}
                variants={item}
                onClick={() => openError(err)}
                className="rounded-2xl border border-border bg-card hover:bg-card/80 p-4 space-y-3 cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
                    <Badge className={`${config.color} border text-xs`} variant="outline">{config.label}</Badge>
                    <span className="text-xs text-muted-foreground">×{err.occurrence_count}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground text-sm line-clamp-2">{err.question}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {err.error_type && (
                    <span>{errorReasons.find((r) => r.id === err.error_type)?.icon} {errorReasons.find((r) => r.id === err.error_type)?.label}</span>
                  )}
                  {err.next_review && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> {new Date(err.next_review).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredErrors.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success/50" />
            <p className="font-medium">
              {tab === "mastered" ? "Aucune erreur maîtrisée pour l'instant" : "Aucune erreur dans cette catégorie 🎉"}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ==================== MAIN DASHBOARD VIEW ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mon Cahier d'Erreurs</h1>
        <p className="text-muted-foreground mt-1">
          Transforme tes erreurs en points forts grâce à la répétition espacée.
        </p>
      </div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Flame className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-xs text-muted-foreground">À revoir aujourd'hui</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{todayReview}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <span className="text-xs text-muted-foreground">Taux de correction</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{correctionRate}%</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <span className="text-xs text-muted-foreground">Erreurs critiques</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{criticalErrors}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Points faibles</span>
          </div>
          <p className="text-sm font-semibold text-foreground line-clamp-1">
            {weakSubjects.length > 0 ? weakSubjects.join(", ") : "Aucun 🎉"}
          </p>
        </div>
      </motion.div>

      {/* Motivation banner */}
      {masteredErrors > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-gradient-to-r from-success/10 to-primary/10 border border-success/20 p-4 flex items-center gap-3"
        >
          <Sparkles className="h-5 w-5 text-success shrink-0" />
          <p className="text-sm text-foreground">
            Tu as corrigé <span className="font-bold">{masteredErrors} erreur{masteredErrors > 1 ? "s" : ""}</span> 🔥
            {totalErrors - masteredErrors > 0 && (
              <> · Encore <span className="font-bold">{totalErrors - masteredErrors}</span> erreur{totalErrors - masteredErrors > 1 ? "s" : ""} à maîtriser</>
            )}
          </p>
        </motion.div>
      )}

      {/* Subject Cards */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Par matière
        </h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {subjectGroups.map((group) => {
            const colors = subjectColorMap[group.color] || subjectColorMap.chemistry;
            const rate = group.errors.length > 0 ? Math.round((group.masteredCount / group.errors.length) * 100) : 0;

            return (
              <motion.div
                key={group.name}
                variants={item}
                onClick={() => setSelectedSubject(group.name)}
                className={`rounded-2xl border border-border ${colors.light} p-5 cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 space-y-3`}
              >
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
                  {group.bySource.kholle.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Khôlles: {group.bySource.kholle.length}</Badge>
                  )}
                  {group.bySource.exam.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">EB: {group.bySource.exam.length}</Badge>
                  )}
                  {group.bySource.annale.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Annales: {group.bySource.annale.length}</Badge>
                  )}
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
