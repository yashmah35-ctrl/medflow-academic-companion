import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserStats {
  xp: number;
  level: number;
  streak_days: number;
  last_active_date: string | null;
}

// XP thresholds per level
const XP_PER_LEVEL = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];

export function computeLevel(xp: number): number {
  let lvl = 1;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (xp >= XP_PER_LEVEL[i]) lvl = i + 1;
    else break;
  }
  return lvl;
}

export function xpForNextLevel(level: number): number {
  return XP_PER_LEVEL[level] || XP_PER_LEVEL[XP_PER_LEVEL.length - 1] + 2000;
}

export function xpForCurrentLevel(level: number): number {
  return XP_PER_LEVEL[level - 1] || 0;
}

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchStats = async () => {
      // Get or create stats
      let { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data && !error) {
        // Create stats for existing user
        const { data: created } = await supabase
          .from("user_stats")
          .insert({ user_id: user.id })
          .select()
          .single();
        data = created;
      }

      if (data) {
        // Update streak
        const today = new Date().toISOString().split("T")[0];
        const lastActive = data.last_active_date;
        let streakDays = data.streak_days;

        if (lastActive) {
          const lastDate = new Date(lastActive);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
          
          if (diffDays > 1) {
            streakDays = 0; // Streak broken
          }
        }

        setStats({
          xp: data.xp,
          level: computeLevel(data.xp),
          streak_days: streakDays,
          last_active_date: data.last_active_date,
        });
      }

      // Get rank (position among all users by XP)
      const { count } = await supabase
        .from("user_stats")
        .select("*", { count: "exact", head: true })
        .gte("xp", data?.xp || 0);
      
      setRank(count || 1);
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  const addXP = async (amount: number) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    const { data: current } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!current) return;

    let newStreak = current.streak_days;
    const lastActive = current.last_active_date;

    if (lastActive !== today) {
      if (lastActive) {
        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
        newStreak = diffDays === 1 ? current.streak_days + 1 : diffDays === 0 ? current.streak_days : 1;
      } else {
        newStreak = 1;
      }
    }

    // Streak bonus: multiply XP by streak multiplier
    const streakMultiplier = 1 + Math.min(newStreak, 7) * 0.1; // max 1.7x
    const finalXP = Math.round(amount * streakMultiplier);
    const newXP = current.xp + finalXP;
    const newLevel = computeLevel(newXP);

    await supabase
      .from("user_stats")
      .update({
        xp: newXP,
        level: newLevel,
        streak_days: newStreak,
        last_active_date: today,
      })
      .eq("user_id", user.id);

    setStats({
      xp: newXP,
      level: newLevel,
      streak_days: newStreak,
      last_active_date: today,
    });

    return { xpGained: finalXP, streakMultiplier };
  };

  return { stats, rank, loading, addXP };
}
