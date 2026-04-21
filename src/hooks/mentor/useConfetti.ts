import { useCallback } from 'react';

export function useConfetti() {
  const fireConfetti = useCallback(async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      
      const defaults = {
        spread: 360,
        ticks: 100,
        gravity: 0.8,
        decay: 0.94,
        startVelocity: 30,
      };

      const fire = (particleRatio: number, opts: Record<string, unknown>) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(200 * particleRatio),
          origin: { x: 0.5, y: 0.6 },
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#FBBF24', '#F59E0B', '#10B981'] });
      fire(0.2, { spread: 60, colors: ['#3B82F6', '#8B5CF6', '#EC4899'] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#FBBF24', '#10B981', '#3B82F6'] });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#F59E0B'] });
      fire(0.1, { spread: 120, startVelocity: 45, colors: ['#FBBF24', '#10B981'] });
    } catch {
      // Confetti non disponible
    }
  }, []);

  const fireSmall = useCallback(async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { x: 0.5, y: 0.7 },
        colors: ['#FBBF24', '#10B981', '#3B82F6'],
        ticks: 80,
      });
    } catch {
      // Ignorer
    }
  }, []);

  return { fireConfetti, fireSmall };
}
