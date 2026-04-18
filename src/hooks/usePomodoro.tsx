import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { toast } from "sonner";
import { useUserStats } from "./useUserStats";

export type PomodoroPreset = 25 | 5 | 15;

export const PRESET_LABELS: Record<PomodoroPreset, string> = {
  25: "Concentration",
  5: "Pause courte",
  15: "Pause longue",
};

const TODAY_KEY = () => `pomodoro_sessions_${new Date().toISOString().slice(0, 10)}`;
const GOAL_KEY = "pomodoro_daily_goal";
const STATE_KEY = "pomodoro_state_v1";
const MUTED_KEY = "pomodoro_muted";

function playEndChime() {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    // Two soft bell tones
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.25;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1);
    });
    setTimeout(() => ctx.close(), 2500);
  } catch {}
}

interface PersistedState {
  preset: PomodoroPreset;
  endsAt: number | null; // timestamp ms when timer ends (if running)
  remainingWhenPaused: number | null; // seconds remaining when paused
  isRunning: boolean;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { preset: 25, endsAt: null, remainingWhenPaused: null, isRunning: false };
}

function saveState(s: PersistedState) {
  localStorage.setItem(STATE_KEY, JSON.stringify(s));
}

interface PomodoroContextValue {
  preset: PomodoroPreset;
  secondsLeft: number;
  isRunning: boolean;
  sessionsCompleted: number;
  goal: number;
  muted: boolean;
  toggle: () => void;
  reset: () => void;
  switchPreset: (p: PomodoroPreset) => void;
  setGoal: (g: number | ((g: number) => number)) => void;
  setMuted: (m: boolean | ((m: boolean) => boolean)) => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const initial = loadState();
  const { addXP } = useUserStats();
  const [preset, setPreset] = useState<PomodoroPreset>(initial.preset);
  const [isRunning, setIsRunning] = useState(initial.isRunning && !!initial.endsAt && initial.endsAt > Date.now());
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (initial.isRunning && initial.endsAt) {
      return Math.max(0, Math.ceil((initial.endsAt - Date.now()) / 1000));
    }
    if (initial.remainingWhenPaused != null) return initial.remainingWhenPaused;
    return initial.preset * 60;
  });
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [goal, setGoalState] = useState(8);
  const endsAtRef = useRef<number | null>(initial.endsAt);
  const intervalRef = useRef<number | null>(null);
  const addXPRef = useRef(addXP);
  useEffect(() => { addXPRef.current = addXP; }, [addXP]);

  // Load sessions/goal on mount
  useEffect(() => {
    setSessionsCompleted(parseInt(localStorage.getItem(TODAY_KEY()) || "0", 10));
    setGoalState(parseInt(localStorage.getItem(GOAL_KEY) || "8", 10));
  }, []);

  const persist = useCallback((overrides: Partial<PersistedState> = {}) => {
    saveState({
      preset,
      endsAt: endsAtRef.current,
      remainingWhenPaused: isRunning ? null : secondsLeft,
      isRunning,
      ...overrides,
    });
  }, [preset, isRunning, secondsLeft]);

  const mutedRef = useRef(false);
  const [muted, setMutedState] = useState(false);
  useEffect(() => {
    const m = localStorage.getItem(MUTED_KEY) === "1";
    mutedRef.current = m;
    setMutedState(m);
  }, []);

  const handleSessionEnd = useCallback((finishedPreset: PomodoroPreset) => {
    if (!mutedRef.current) playEndChime();
    if (finishedPreset === 25) {
      setSessionsCompleted((prev) => {
        const next = prev + 1;
        localStorage.setItem(TODAY_KEY(), String(next));
        return next;
      });
      // Award 5 XP per concentration session
      addXPRef.current?.(5)?.then?.((res) => {
        if (res?.xpGained) {
          toast.success(`Session terminée ! 🔥 +${res.xpGained} XP`);
        } else {
          toast.success("Session de concentration terminée ! 🔥 +5 XP");
        }
      }).catch(() => {
        toast.success("Session de concentration terminée ! 🔥 +5 XP");
      });
    } else {
      toast.info("Pause terminée. Prêt à repartir ! 💪");
    }
  }, []);

  // Tick
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      const end = endsAtRef.current;
      if (!end) return;
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        const finishedPreset = preset;
        endsAtRef.current = null;
        setIsRunning(false);
        setSecondsLeft(finishedPreset * 60);
        saveState({
          preset: finishedPreset,
          endsAt: null,
          remainingWhenPaused: null,
          isRunning: false,
        });
        handleSessionEnd(finishedPreset);
      }
    }, 250);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isRunning, preset, handleSessionEnd]);

  const toggle = useCallback(() => {
    if (isRunning) {
      // Pause
      const remaining = endsAtRef.current
        ? Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000))
        : secondsLeft;
      endsAtRef.current = null;
      setIsRunning(false);
      setSecondsLeft(remaining);
      saveState({ preset, endsAt: null, remainingWhenPaused: remaining, isRunning: false });
    } else {
      const newEnd = Date.now() + secondsLeft * 1000;
      endsAtRef.current = newEnd;
      setIsRunning(true);
      saveState({ preset, endsAt: newEnd, remainingWhenPaused: null, isRunning: true });
    }
  }, [isRunning, secondsLeft, preset]);

  const reset = useCallback(() => {
    endsAtRef.current = null;
    setIsRunning(false);
    setSecondsLeft(preset * 60);
    saveState({ preset, endsAt: null, remainingWhenPaused: null, isRunning: false });
  }, [preset]);

  const switchPreset = useCallback((p: PomodoroPreset) => {
    endsAtRef.current = null;
    setPreset(p);
    setIsRunning(false);
    setSecondsLeft(p * 60);
    saveState({ preset: p, endsAt: null, remainingWhenPaused: null, isRunning: false });
  }, []);

  const setGoal = useCallback((g: number | ((g: number) => number)) => {
    setGoalState((prev) => {
      const next = typeof g === "function" ? g(prev) : g;
      const clamped = Math.max(1, Math.min(20, next));
      localStorage.setItem(GOAL_KEY, String(clamped));
      return clamped;
    });
  }, []);

  const setMuted = useCallback((m: boolean | ((m: boolean) => boolean)) => {
    setMutedState((prev) => {
      const next = typeof m === "function" ? m(prev) : m;
      mutedRef.current = next;
      localStorage.setItem(MUTED_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return (
    <PomodoroContext.Provider
      value={{ preset, secondsLeft, isRunning, sessionsCompleted, goal, muted, toggle, reset, switchPreset, setGoal, setMuted }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider");
  return ctx;
}
