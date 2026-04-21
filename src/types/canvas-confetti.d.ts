declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    ticks?: number;
    gravity?: number;
    decay?: number;
    startVelocity?: number;
    colors?: string[];
    origin?: { x: number; y: number };
    scalar?: number;
    shapes?: string[];
    disableForReducedMotion?: boolean;
    zIndex?: number;
  }
  function confetti(options?: ConfettiOptions): Promise<void>;
  export default confetti;
}
