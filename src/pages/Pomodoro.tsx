import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Mode = "work" | "break";

const DURATIONS: Record<Mode, number> = {
  work: 25 * 60,
  break: 5 * 60,
};

export default function Pomodoro() {
  const [mode, setMode] = useState<Mode>("work");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            const nextMode: Mode = mode === "work" ? "break" : "work";
            if (mode === "work") {
              setSessionsCompleted((c) => c + 1);
              toast.success("Session terminée ! Pause bien méritée 🎉");
            } else {
              toast.info("Pause terminée. C'est reparti ! 💪");
            }
            setMode(nextMode);
            setIsRunning(false);
            return DURATIONS[nextMode];
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const reset = () => {
    setIsRunning(false);
    setSecondsLeft(DURATIONS[mode]);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setSecondsLeft(DURATIONS[m]);
    setIsRunning(false);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = ((DURATIONS[mode] - secondsLeft) / DURATIONS[mode]) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Pomodoro</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Technique d'étude par sessions de concentration
        </p>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant={mode === "work" ? "default" : "outline"}
          size="sm"
          onClick={() => switchMode("work")}
          className="rounded-full"
        >
          <Brain className="h-4 w-4 mr-1.5" /> Travail (25 min)
        </Button>
        <Button
          variant={mode === "break" ? "default" : "outline"}
          size="sm"
          onClick={() => switchMode("break")}
          className="rounded-full"
        >
          <Coffee className="h-4 w-4 mr-1.5" /> Pause (5 min)
        </Button>
      </div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-3xl bg-card border border-border p-8 md:p-10 flex flex-col items-center"
      >
        <div className="relative">
          <svg width="280" height="280" className="transform -rotate-90">
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
            />
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke={mode === "work" ? "hsl(var(--primary))" : "hsl(var(--warning))"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold text-foreground tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-sm text-muted-foreground mt-2 capitalize">
              {mode === "work" ? "Concentration" : "Pause"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <Button
            size="lg"
            onClick={() => setIsRunning((r) => !r)}
            className={cn(
              "rounded-full h-14 w-14 p-0",
              mode === "work" ? "bg-primary hover:bg-primary/90" : "bg-warning hover:bg-warning/90 text-warning-foreground"
            )}
          >
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={reset}
            className="rounded-full h-14 w-14 p-0"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Sessions complétées aujourd'hui :{" "}
          <span className="font-bold text-foreground">{sessionsCompleted}</span>
        </p>
      </motion.div>
    </div>
  );
}
