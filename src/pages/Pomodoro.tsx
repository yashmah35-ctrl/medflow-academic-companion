import { Play, Pause, RotateCcw, Timer, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePomodoro, PRESET_LABELS, PomodoroPreset } from "@/hooks/usePomodoro";

export default function Pomodoro() {
  const {
    preset,
    secondsLeft,
    isRunning,
    sessionsCompleted,
    goal,
    toggle,
    reset,
    switchPreset,
    setGoal,
  } = usePomodoro();

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const total = preset * 60;
  const progress = ((total - secondsLeft) / total) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const presets: PomodoroPreset[] = [25, 5, 15];

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="text-center space-y-2">
        <Timer className="h-7 w-7 mx-auto text-foreground" strokeWidth={2} />
        <h1 className="text-3xl font-bold text-foreground">Pomodoro</h1>
        <p className="text-sm text-muted-foreground">
          Gérez votre temps de révision efficacement
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => switchPreset(p)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-medium transition-all border",
              preset === p
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-card text-foreground border-border hover:border-foreground/30"
            )}
          >
            {p} min
          </button>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-3xl bg-card border border-border p-8 md:p-10 flex flex-col items-center shadow-sm"
      >
        <div className="relative">
          <svg width="280" height="280" className="transform -rotate-90">
            <circle cx="140" cy="140" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold text-foreground tabular-nums tracking-tight">
              {String(minutes).padStart(2, "0")}
              <span className="text-primary mx-1">:</span>
              {String(seconds).padStart(2, "0")}
            </span>
            <span className="text-sm text-primary font-medium mt-2">
              {PRESET_LABELS[preset]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <Button
            size="lg"
            onClick={toggle}
            className="rounded-full h-14 w-14 p-0 bg-primary hover:bg-primary/90 shadow-md"
          >
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>
          <Button size="lg" variant="outline" onClick={reset} className="rounded-full h-14 w-14 p-0">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Sessions aujourd'hui</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGoal((g) => g - 1)}
              className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Diminuer l'objectif"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-medium tabular-nums w-14 text-center">Obj. {goal}</span>
            <button
              onClick={() => setGoal((g) => g + 1)}
              className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Augmenter l'objectif"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {Array.from({ length: goal }).map((_, i) => {
            const done = i < sessionsCompleted;
            return (
              <div
                key={i}
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all",
                  done ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{sessionsCompleted}</span> session
          {sessionsCompleted > 1 ? "s" : ""} complétée{sessionsCompleted > 1 ? "s" : ""} sur {goal} objectif
        </p>
      </div>
    </div>
  );
}
