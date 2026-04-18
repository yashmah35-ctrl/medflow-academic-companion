import { Flame, Zap, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  streakDays: number;
  xp: number;
  qcmSuccessRate: number;
  rank: number | null;
}

const cards = [
  { key: "streak", label: "Jours de suite", icon: Flame, tint: "bg-orange-100 text-orange-500" },
  { key: "xp", label: "XP gagnés", icon: Zap, tint: "bg-teal-100 text-primary" },
  { key: "qcm", label: "QCM réussis", icon: TrendingUp, tint: "bg-blue-100 text-blue-500" },
  { key: "rank", label: "Rang", icon: Award, tint: "bg-purple-100 text-purple-500" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function StatCards({ streakDays, xp, qcmSuccessRate, rank }: StatCardsProps) {
  const values: Record<string, string> = {
    streak: String(streakDays),
    xp: String(xp),
    qcm: `${qcmSuccessRate}%`,
    rank: rank ? `#${rank}` : "—",
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
    >
      {cards.map((c) => (
        <motion.div
          key={c.key}
          variants={item}
          className="rounded-2xl bg-card border border-border p-4 md:p-5 hover:shadow-md transition-shadow"
        >
          <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3", c.tint)}>
            <c.icon className="h-5 w-5" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{values[c.key]}</p>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{c.label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
