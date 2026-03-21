import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { scheduleBlocks } from "@/data/mockData";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { subjectColorMap, type SubjectColor } from "@/data/mockData";
import { BookOpen, BarChart3, Target, Flame, Trophy, Search, Sparkles, TreePine, Pencil, Crown } from "lucide-react";
import anatomieOsImg from "@/assets/subjects/anatomie-os.png";
import anatomieTcImg from "@/assets/subjects/anatomie-tc.png";
import shsImg from "@/assets/subjects/shs.png";
import santePubliqueImg from "@/assets/subjects/sante-publique.png";

const subjectImageMap: Record<string, string> = {
  "Anatomie OS": anatomieOsImg,
  "Anatomie TC": anatomieTcImg,
  "SHS TC": shsImg,
  "SHS OS": shsImg,
  "Santé Publique OS": santePubliqueImg,
  "Santé Publique TC": santePubliqueImg,
};
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth, canAccessTC } from "@/hooks/useAuth";
import { useUserStats, xpForNextLevel, xpForCurrentLevel } from "@/hooks/useUserStats";
import { useState, useCallback, useEffect } from "react";
import BloomingTree from "@/components/dashboard/BloomingTree";
import StudyTimer from "@/components/dashboard/StudyTimer";
import { supabase } from "@/integrations/supabase/client";
import PersonalCoursesSection from "@/components/dashboard/PersonalCoursesSection";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumModal } from "@/components/PremiumPaywall";

interface DBSubject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function ProgressCircle({ value, size = 64 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 70 ? "hsl(var(--success))" : value >= 40 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={4} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
}

const Index = () => {
  const navigate = useNavigate();
  const { role, user, isAdmin } = useAuth();
  const { stats, rank } = useUserStats();
  const { isSubscribed } = useSubscription();
  const [search, setSearch] = useState("");
  const [studyMinutes, setStudyMinutes] = useState(0);
  const [subjects, setSubjects] = useState<DBSubject[]>([]);
  const [renamingSubject, setRenamingSubject] = useState<string | null>(null);
  const [renameSubjectValue, setRenameSubjectValue] = useState("");
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  const isPremiumLocked = !isSubscribed && !isAdmin;

  const handleMinutesUpdate = useCallback((mins: number) => {
    setStudyMinutes(mins);
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      // Fetch all subjects without default 1000-row limit
      const allSubjects: DBSubject[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from("subjects")
          .select("id, name, icon, color")
          .range(offset, offset + batchSize - 1);
        if (error || !data || data.length === 0) {
          hasMore = false;
        } else {
          allSubjects.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        }
      }
      setSubjects(allSubjects);
    };
    fetchSubjects();
  }, []);

  const handleRenameSubject = async (subjectId: string) => {
    if (!renameSubjectValue.trim()) return;
    const { error } = await supabase
      .from("subjects")
      .update({ name: renameSubjectValue.trim() })
      .eq("id", subjectId);
    if (error) { toast.error("Erreur lors du renommage"); return; }
    setSubjects((prev) => prev.map((s) => s.id === subjectId ? { ...s, name: renameSubjectValue.trim() } : s));
    setRenamingSubject(null);
    setRenameSubjectValue("");
    toast.success("Matière renommée !");
  };

  const filteredSubjects = subjects.filter((s) => {
    if (!canAccessTC(role) && s.name.includes(" TC")) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Compute global schedule progress from localStorage
  const totalProgress = (() => {
    try {
      const saved = localStorage.getItem("schedule-completion");
      if (!saved) return 0;
      const completionMap: Record<string, string> = JSON.parse(saved);
      const total = scheduleBlocks.length;
      if (total === 0) return 0;
      const doneCount = Object.values(completionMap).filter((s) => s === "done").length;
      const partialCount = Object.values(completionMap).filter((s) => s === "partial").length;
      return Math.round(((doneCount + partialCount * 0.5) / total) * 100);
    } catch { return 0; }
  })();

  // Bloom level: based on accumulated XP (each 50 XP = ~1% bloom, max at 5000 XP)
  const bloomLevel = Math.min(100, ((stats?.xp ?? 0) / 5000) * 100 + studyMinutes * 0.5);

  if (isAdmin) {
    return (
      <div className="space-y-6">
        {/* Admin Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Interface Administrateur</h2>
              <p className="text-sm text-muted-foreground">Gérez les cours visibles par tous les étudiants</p>
            </div>
          </div>
        </motion.div>

        {/* Subjects Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">Matières</h2>
            <p className="text-sm text-muted-foreground">Ajoutez et gérez les cours de la Prépa du Peuple.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-muted border border-border pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        {/* Subject Grid */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" variants={container} initial="hidden" animate="show">
          {filteredSubjects.map((s) => {
            const colors = subjectColorMap[s.color as SubjectColor] ?? subjectColorMap.chemistry;
            return (
              <motion.div key={s.id} variants={item}
                className={`group relative overflow-hidden rounded-2xl border border-border ${colors.light} p-5 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col`}
                onClick={() => navigate(`/subject/${s.id}`)}>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Renommer"
                    onClick={() => { setRenamingSubject(s.id); setRenameSubjectValue(s.name); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-start justify-between mb-3">
                  {subjectImageMap[s.name] ? (
                    <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm">
                      <img src={subjectImageMap[s.name]} alt={s.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card/80 text-2xl shadow-sm">{s.icon}</div>
                  )}
                </div>
                {renamingSubject === s.id ? (
                  <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                    <Input value={renameSubjectValue} onChange={(e) => setRenameSubjectValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameSubject(s.id)} className="h-7 text-sm" autoFocus />
                    <Button size="sm" variant="ghost" onClick={() => handleRenameSubject(s.id)}>OK</Button>
                    <Button size="sm" variant="ghost" onClick={() => setRenamingSubject(null)}>✕</Button>
                  </div>
                ) : (
                  <h3 className="font-bold text-foreground text-sm leading-tight mb-2">{s.name}</h3>
                )}
                <div className="mt-auto">
                  <Button size="sm" className="w-full rounded-lg font-semibold text-xs">Gérer les cours</Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Objectif du jour → Emploi du temps */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-10 translate-x-10 blur-2xl" />
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Objectif du jour</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                Emploi du temps
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Progression globale : {totalProgress}%
              </p>
              <div className="mt-3">
                <Progress value={totalProgress} className="h-2.5" />
              </div>
              <Button size="sm" className="mt-3 rounded-lg font-semibold" onClick={() => navigate("/schedule")}>
                Voir mon planning
              </Button>
            </div>
            <div className="relative flex items-center justify-center">
              <ProgressCircle value={totalProgress} size={80} />
              <span className="absolute text-lg font-bold text-foreground">{totalProgress}%</span>
            </div>
          </div>
        </div>

        {/* Streak & Niveau */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-warning/5 rounded-full -translate-y-10 translate-x-10 blur-2xl" />
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-warning" />
            <span className="text-sm font-semibold text-muted-foreground">Série actuelle</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {stats?.streak_days ?? 0} <span className="text-lg font-medium text-muted-foreground">jours</span>
          </p>
          <div className="mt-3">
            {stats ? (
              <Progress value={Math.min(100, ((stats.xp - xpForCurrentLevel(stats.level)) / Math.max(1, xpForNextLevel(stats.level) - xpForCurrentLevel(stats.level))) * 100)} className="h-2.5" />
            ) : (
              <Progress value={0} className="h-2.5" />
            )}
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground font-medium">Niveau {stats?.level ?? 1}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Rang {rank ?? "—"}<sup>e</sup></span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground italic">
            {stats && stats.xp > 0
              ? `${stats.xp} XP · ${xpForNextLevel(stats.level) - stats.xp} XP avant le niveau ${stats.level + 1} 🚀`
              : `Commence à étudier pour gagner des XP 💪`}
          </p>
        </div>
      </motion.div>


      {/* Mes cours personnels */}
      {user && <PersonalCoursesSection userId={user.id} />}

      {/* Separator + Prépa du Peuple subjects */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Cours La Prépa du Peuple</h2>
          <p className="text-sm text-muted-foreground">Continue tes cours et progresse aujourd'hui.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted border border-border pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Subject Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {filteredSubjects.map((s) => {
          const colors = subjectColorMap[s.color as SubjectColor] ?? subjectColorMap.chemistry;
          return (
            <motion.div
              key={s.id}
              variants={item}
              className={`group relative overflow-hidden rounded-2xl border border-border ${colors.light} p-5 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col`}
              onClick={() => {
                if (isPremiumLocked) {
                  setPremiumModalOpen(true);
                  return;
                }
                navigate(`/subject/${s.id}`);
              }}
            >
              {isPremiumLocked && (
                <div className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/90 shadow-sm">
                  <Crown className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              {!isPremiumLocked && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Renommer"
                    onClick={() => { setRenamingSubject(s.id); setRenameSubjectValue(s.name); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                {subjectImageMap[s.name] ? (
                  <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm">
                    <img src={subjectImageMap[s.name]} alt={s.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card/80 text-2xl shadow-sm">
                    {s.icon}
                  </div>
                )}
              </div>
              {renamingSubject === s.id ? (
                <div className="flex items-center gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                  <Input value={renameSubjectValue} onChange={(e) => setRenameSubjectValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRenameSubject(s.id)} className="h-7 text-sm" autoFocus />
                  <Button size="sm" variant="ghost" onClick={() => handleRenameSubject(s.id)}>OK</Button>
                  <Button size="sm" variant="ghost" onClick={() => setRenamingSubject(null)}>✕</Button>
                </div>
              ) : (
                <h3 className="font-bold text-foreground text-sm leading-tight mb-2">{s.name}</h3>
              )}
              <div className="mt-auto">
                <Button size="sm" className={cn("w-full rounded-lg font-semibold text-xs", isPremiumLocked && "bg-amber-500/80 hover:bg-amber-500")}>
                  {isPremiumLocked ? "Premium" : "Continuer"}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recommandé */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-3">Recommandé pour toi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 to-primary/5 p-5 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate("/flashcards")}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-sm">Révise tes Flashcards</p>
              <p className="text-xs text-muted-foreground">Renforce ta mémoire active</p>
            </div>
            <Button size="sm" className="rounded-lg font-semibold">Commencer</Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-border bg-gradient-to-r from-success/10 to-success/5 p-5 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
              <Sparkles className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-sm">Active une pause de 5 min</p>
              <p className="text-xs text-muted-foreground">Préviens la fatigue mentale</p>
            </div>
            <Button size="sm" variant="secondary" className="rounded-lg font-semibold">Pause active</Button>
          </motion.div>
        </div>
      </div>
      <PremiumModal open={premiumModalOpen} onOpenChange={setPremiumModalOpen} />
    </div>
  );
};

export default Index;
