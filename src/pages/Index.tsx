import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { subjects, subjectColorMap } from "@/data/mockData";
import { BookOpen, BarChart3, Target, Flame, Trophy, Search, Clock, Sparkles } from "lucide-react";
import { useAuth, canAccessTC } from "@/hooks/useAuth";
import { useState } from "react";

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
  const { role, user } = useAuth();
  const [search, setSearch] = useState("");

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Étudiant";

  const filteredSubjects = subjects.filter((s) => {
    if (!canAccessTC(role) && s.name.includes(" TC")) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalProgress = Math.round(filteredSubjects.reduce((a, s) => a + s.progress, 0) / filteredSubjects.length);
  const totalExercises = filteredSubjects.reduce((a, s) => a + s.exerciseCount, 0);
  const doneExercises = Math.round(totalExercises * totalProgress / 100);

  return (
    <div className="space-y-6">
      {/* Dashboard Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Objectif du jour */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-10 translate-x-10 blur-2xl" />
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Objectif du jour</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {totalExercises - doneExercises} <span className="text-lg font-medium text-muted-foreground">QCM restants</span>
              </p>
              <div className="mt-3">
                <Progress value={totalProgress} className="h-2.5" />
                <p className="text-xs text-muted-foreground mt-1">{doneExercises}/{totalExercises} QCM</p>
              </div>
              <Button size="sm" className="mt-3 rounded-lg font-semibold" onClick={() => navigate("/learning")}>
                Continuer
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
            6 <span className="text-lg font-medium text-muted-foreground">jours</span>
          </p>
          <div className="mt-3">
            <Progress value={60} className="h-2.5" />
          </div>
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground font-medium">Niveau 5</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Rang 12<sup>e</sup></span>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground italic">
            "Tu maîtrises {totalProgress}% du programme. Continue comme ça 💪"
          </p>
        </div>
      </motion.div>

      {/* Subjects Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Mes Matières</h2>
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
          const colors = subjectColorMap[s.color];
          const progressColor = s.progress >= 70 ? "text-success" : s.progress >= 40 ? "text-warning" : "text-destructive";
          return (
            <motion.div
              key={s.id}
              variants={item}
              className={`group relative overflow-hidden rounded-2xl border border-border ${colors.light} p-5 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col`}
              onClick={() => navigate(`/subject/${s.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card/80 text-2xl shadow-sm">
                  {s.icon}
                </div>
                <div className="relative flex items-center justify-center">
                  <ProgressCircle value={s.progress} size={44} />
                  <span className={`absolute text-[10px] font-bold ${progressColor}`}>{s.progress}%</span>
                </div>
              </div>
              <h3 className="font-bold text-foreground text-sm leading-tight mb-2">{s.name}</h3>
              <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {s.courseCount} Cours</span>
                <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {s.exerciseCount} QCM</span>
              </div>
              <div className="mt-auto">
                <Button size="sm" className="w-full rounded-lg font-semibold text-xs">
                  Continuer
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
            onClick={() => navigate("/learning")}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-sm">100 QCM d'Anatomie à réviser</p>
              <p className="text-xs text-muted-foreground">Chapitre 7 : Système digestif</p>
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
    </div>
  );
};

export default Index;
