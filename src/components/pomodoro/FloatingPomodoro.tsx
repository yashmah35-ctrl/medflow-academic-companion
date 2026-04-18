import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw, Volume2, VolumeX, X, Maximize2 } from "lucide-react";
import { useState } from "react";
import { usePomodoro, PRESET_LABELS } from "@/hooks/usePomodoro";
import { cn } from "@/lib/utils";

export function FloatingPomodoro() {
  const location = useLocation();
  const navigate = useNavigate();
  const { preset, secondsLeft, isRunning, toggle, reset, muted, setMuted } = usePomodoro();
  const [hidden, setHidden] = useState(false);

  // Hide on the Pomodoro page itself or auth pages
  if (
    location.pathname.startsWith("/pomodoro") ||
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/reset-password")
  ) {
    return null;
  }

  // Only show when running OR when paused mid-session (not full duration)
  const fullSeconds = preset * 60;
  const isMidSession = secondsLeft < fullSeconds;
  if (!isRunning && !isMidSession) return null;
  if (hidden) return null;

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const progress = ((fullSeconds - secondsLeft) / fullSeconds) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-20 md:bottom-6 right-4 z-50"
      >
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-lg p-2 pl-3">
          {/* Mini progress ring */}
          <div className="relative h-9 w-9 flex-shrink-0">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 15}
                strokeDashoffset={2 * Math.PI * 15 * (1 - progress / 100)}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className={cn("absolute inset-0 flex items-center justify-center", isRunning && "animate-pulse")}>
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>
          </div>

          <div className="flex flex-col leading-tight pr-1">
            <span className="text-sm font-bold tabular-nums text-foreground">
              {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted-foreground">{PRESET_LABELS[preset]}</span>
          </div>

          <button
            onClick={toggle}
            className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            aria-label={isRunning ? "Pause" : "Reprendre"}
          >
            {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
          </button>
          <button
            onClick={reset}
            className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Réinitialiser"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setMuted((v) => !v)}
            className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label={muted ? "Activer le son" : "Couper le son"}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => navigate("/pomodoro")}
            className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Ouvrir le Pomodoro"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setHidden(true)}
            className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground"
            aria-label="Masquer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
