import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StudyTimerProps {
  onMinutesUpdate?: (totalMinutes: number) => void;
}

const StudyTimer = ({ onMinutesUpdate }: StudyTimerProps) => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [totalStudyMinutes, setTotalStudyMinutes] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load total study minutes from user_stats
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("user_stats")
        .select("xp")
        .eq("user_id", user.id)
        .maybeSingle();
      // We'll use xp as a proxy — or we just track locally
      // For now, track session time only
    };
    load();
  }, [user]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Every minute, update callback
  useEffect(() => {
    const mins = Math.floor(seconds / 60);
    if (mins > 0 && mins !== totalStudyMinutes) {
      setTotalStudyMinutes(mins);
      onMinutesUpdate?.(mins);
    }
  }, [seconds, totalStudyMinutes, onMinutesUpdate]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleStop = useCallback(async () => {
    setIsRunning(false);
    const earnedMinutes = Math.floor(seconds / 60);
    if (earnedMinutes > 0 && user) {
      // Award XP: 2 XP per minute studied
      const xpEarned = earnedMinutes * 2;
      const { data: stats } = await supabase
        .from("user_stats")
        .select("xp, level, streak_days, last_active_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (stats) {
        const today = new Date().toISOString().slice(0, 10);
        const newXp = stats.xp + xpEarned;
        // Level up: each level = level * 100 XP
        let newLevel = stats.level;
        while (newXp >= newLevel * 100) {
          newLevel++;
        }
        // Streak
        let newStreak = stats.streak_days;
        if (stats.last_active_date !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (stats.last_active_date === yesterday.toISOString().slice(0, 10)) {
            newStreak += 1;
          } else if (stats.last_active_date !== today) {
            newStreak = 1;
          }
        }

        await supabase
          .from("user_stats")
          .update({
            xp: newXp,
            level: newLevel,
            streak_days: newStreak,
            last_active_date: today,
          })
          .eq("user_id", user.id);
      }
    }
    setSeconds(0);
    setTotalStudyMinutes(0);
  }, [seconds, user]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">Minuteur d'étude</span>
      </div>

      <div className="flex items-center justify-between">
        <AnimatePresence mode="wait">
          <motion.p
            key={isRunning ? "running" : "stopped"}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-3xl font-bold text-foreground font-mono tabular-nums"
          >
            {formatTime(seconds)}
          </motion.p>
        </AnimatePresence>

        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              size="sm"
              onClick={handleStart}
              className="rounded-xl gap-1.5 font-semibold"
            >
              <Play className="h-4 w-4" />
              {seconds > 0 ? "Reprendre" : "Démarrer"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={handlePause}
              className="rounded-xl gap-1.5 font-semibold"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          {seconds > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleStop}
              className="rounded-xl gap-1.5 font-semibold"
            >
              <Square className="h-4 w-4" />
              Fin
            </Button>
          )}
        </div>
      </div>

      {seconds > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          +{Math.floor(seconds / 60) * 2} XP gagnés · {Math.floor(seconds / 60)} min étudiées
        </p>
      )}
    </motion.div>
  );
};

export default StudyTimer;
