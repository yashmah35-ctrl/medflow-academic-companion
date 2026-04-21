import { useCallback, useRef } from 'react';

// Système audio simple utilisant Web Audio API
const audioCtxRef: { current: AudioContext | null } = { current: null };

function getAudioContext(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtxRef.current;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio non supporté
  }
}

export function useSound() {
  const enabled = useRef(true);

  const toggleSound = useCallback(() => {
    enabled.current = !enabled.current;
    return enabled.current;
  }, []);

  const playCorrect = useCallback(() => {
    if (!enabled.current) return;
    playTone(523, 0.15, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 80);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.15), 160);
  }, []);

  const playWrong = useCallback(() => {
    if (!enabled.current) return;
    playTone(200, 0.3, 'sawtooth', 0.08);
    setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.06), 120);
  }, []);

  const playLevelUp = useCallback(() => {
    if (!enabled.current) return;
    playTone(440, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(554, 0.1, 'sine', 0.1), 80);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.1), 160);
    setTimeout(() => playTone(880, 0.3, 'sine', 0.15), 240);
  }, []);

  const playComplete = useCallback(() => {
    if (!enabled.current) return;
    playTone(523, 0.15, 'sine', 0.12);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 100);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.12), 200);
    setTimeout(() => playTone(1047, 0.4, 'sine', 0.18), 300);
  }, []);

  const playBadge = useCallback(() => {
    if (!enabled.current) return;
    playTone(523, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.1), 80);
    setTimeout(() => playTone(784, 0.1, 'sine', 0.1), 160);
    setTimeout(() => playTone(1047, 0.2, 'sine', 0.14), 240);
    setTimeout(() => playTone(1319, 0.4, 'sine', 0.18), 320);
  }, []);

  const playClick = useCallback(() => {
    if (!enabled.current) return;
    playTone(800, 0.05, 'sine', 0.06);
  }, []);

  return { playCorrect, playWrong, playLevelUp, playComplete, playBadge, playClick, toggleSound, enabled };
}
