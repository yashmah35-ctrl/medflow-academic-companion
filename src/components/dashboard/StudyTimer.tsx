import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { computeLevel } from "@/hooks/useUserStats";

interface StudyTimerProps {
  onMinutesUpdate?: (totalMinutes: number) => void;
}

const STORAGE_KEY = "study-timer-state";

interface TimerState {
  startedAt: number | null; // timestamp when timer was started/resumed
  accumulatedSeconds: number; // seconds accumulated before last pause
  isRunning: boolean;
}

function loadTimerState(): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { startedAt: null, accumulatedSeconds: 0, isRunning: false };
}

function saveTimerState(state: TimerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearTimerState() {
  localStorage.removeItem(STORAGE_KEY);
}

function getCurrentSeconds(state: TimerState): number {
  const base = state.accumulatedSeconds;
  if (state.isRunning && state.startedAt) {
    return base + Math.floor((Date.now() - state.startedAt) / 1000);
  }
  return base;
}

const StudyTimer = ({ onMinutesUpdate }: StudyTimerProps) => {
  const { user } = useAuth();
  const [timerState, setTimerState] = useState<TimerState>(loadTimerState);
  const [displaySeconds, setDisplaySeconds] = useState(() => getCurrentSeconds(loadTimerState()));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastReportedMinutes = useRef(0);

  // Tick display
  useEffect(() => {
    if (timerState.isRunning) {
      setDisplaySeconds(getCurrentSeconds(timerState));
      intervalRef.current = setInterval(() => {
        setDisplaySeconds(getCurrentSeconds(timerState));
      }, 1000);
    } else {
      setDisplaySeconds(getCurrentSeconds(timerState));
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  // Report minutes to parent
  useEffect(() => {
    const mins = Math.floor(displaySeconds / 60);
    if (mins !== lastReportedMinutes.current) {
      lastReportedMinutes.current = mins;
      onMinutesUpdate?.(mins);
    }
  }, [displaySeconds, onMinutesUpdate]);

  const handleStart = () => {
    const newState: TimerState = {
      ...timerState,
      startedAt: Date.now(),
      isRunning: true,
    };
    setTimerState(newState);
    saveTimerState(newState);
  };

  const handlePause = () => {
    const newState: TimerState = {
      accumulatedSeconds: getCurrentSeconds(timerState),
      startedAt: null,
      isRunning: false,
    };
    setTimerState(newState);
    saveTimerState(newState);
  };

  const handleStop = useCallback(async () => {
    const totalSeconds = getCurrentSeconds(timerState);
    const earnedMinutes = Math.floor(totalSeconds / 60);

    if (earnedMinutes > 0 && user) {
      const xpEarned = earnedMinutes * 2;
      const { data: stats } = await supabase
        .from("user_stats")
        .select("xp, level, streak_days, last_active_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (stats) {
        const today = new Date().toISOString().slice(0, 10);
        const newXp = stats.xp + xpEarned;
        const newLevel = computeLevel(newXp);
        let newStreak = stats.streak_days;
        if (stats.last_active_date !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (stats.last_active_date === yesterday.toISOString().slice(0, 10)) {
            newStreak += 1;
          } else {
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

    const resetState: TimerState = { startedAt: null, accumulatedSeconds: 0, isRunning: false };
    setTimerState(resetState);
    clearTimerState();
    setDisplaySeconds(0);
    lastReportedMinutes.current = 0;
    onMinutesUpdate?.(0);
  }, [timerState, user, onMinutesUpdate]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const isRunning = timerState.isRunning;

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
            {formatTime(displaySeconds)}
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
              {displaySeconds > 0 ? "Reprendre" : "Démarrer"}
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
          {displaySeconds > 0 && (
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

      {displaySeconds > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          +{Math.floor(displaySeconds / 60) * 2} XP gagnés · {Math.floor(displaySeconds / 60)} min étudiées
        </p>
      )}
    </motion.div>
  );
};

export default StudyTimer;
