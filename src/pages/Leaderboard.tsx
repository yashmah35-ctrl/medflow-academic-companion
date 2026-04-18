import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Entry {
  user_id: string;
  xp: number;
  level: number;
  streak_days: number;
  full_name: string | null;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Fetch top users by XP. Pull stats then attach profiles client-side
      // (no FK between user_stats and profiles for an embedded join).
      const { data: stats } = await supabase
        .from("user_stats")
        .select("user_id, xp, level, streak_days")
        .order("xp", { ascending: false })
        .limit(50);

      if (!stats) {
        setLoading(false);
        return;
      }

      const ids = stats.map((s) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) ?? []);
      setEntries(
        stats
          .filter((s) => s.xp > 0)
          .map((s) => ({
            ...s,
            full_name: profileMap.get(s.user_id) ?? null,
          }))
      );
      setLoading(false);
    };
    load();
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: "text-yellow-500 bg-yellow-100" };
    if (rank === 2) return { icon: Medal, color: "text-gray-400 bg-gray-100" };
    if (rank === 3) return { icon: Award, color: "text-orange-500 bg-orange-100" };
    return null;
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
          <Trophy className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Classement</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Top 50 des étudiants par XP
        </p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">Chargement…</p>
      ) : entries.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Aucun étudiant classé pour le moment.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((e, i) => {
            const rank = i + 1;
            const badge = getRankBadge(rank);
            const isMe = e.user_id === user?.id;
            const displayName = e.full_name || `Étudiant #${rank}`;
            return (
              <motion.div
                key={e.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  isMe
                    ? "bg-primary/5 border-primary/30 shadow-sm"
                    : "bg-card border-border"
                )}
              >
                <div className="w-10 flex justify-center">
                  {badge ? (
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", badge.color)}>
                      <badge.icon className="h-5 w-5" />
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {displayName} {isMe && <span className="text-xs text-primary">(vous)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Niveau {e.level} · {e.streak_days} jour{e.streak_days > 1 ? "s" : ""} de suite
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary tabular-nums">{e.xp}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
