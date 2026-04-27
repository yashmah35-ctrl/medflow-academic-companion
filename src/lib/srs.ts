// Spaced Repetition System — Ebbinghaus/Anki-inspired
// Levels 0-6, intervals in minutes (levels 0-2) then days (levels 3+)

export type SRSRating = "again" | "hard" | "good" | "easy";

export interface SRSCardState {
  level: number;         // 0-6
  interval: number;      // minutes for levels 0-2, days for levels 3+
  lastRating: SRSRating | null;
  nextReview: number;    // timestamp ms
  reviewCount: number;
}

interface Transition {
  newLevel: number;
  intervalMinutes?: number;
  intervalDays?: number;
}

// SRS_TABLE[currentLevel][rating] => { newLevel, intervalMinutes or intervalDays }
const SRS_TABLE: Record<number, Record<SRSRating, Transition>> = {
  0: {
    again: { newLevel: 0, intervalMinutes: 1 },
    hard:  { newLevel: 1, intervalMinutes: 3 },
    good:  { newLevel: 2, intervalMinutes: 7 },
    easy:  { newLevel: 3, intervalMinutes: 10 },
  },
  1: {
    again: { newLevel: 0, intervalMinutes: 1 },
    hard:  { newLevel: 1, intervalMinutes: 3 },
    good:  { newLevel: 2, intervalMinutes: 7 },
    easy:  { newLevel: 3, intervalMinutes: 10 },
  },
  2: {
    again: { newLevel: 1, intervalMinutes: 1 },
    hard:  { newLevel: 1, intervalMinutes: 3 },
    good:  { newLevel: 3, intervalMinutes: 7 },
    easy:  { newLevel: 4, intervalMinutes: 10 },
  },
  3: {
    again: { newLevel: 2, intervalMinutes: 1 },
    hard:  { newLevel: 2, intervalMinutes: 3 },
    good:  { newLevel: 4, intervalMinutes: 7 },
    easy:  { newLevel: 5, intervalMinutes: 10 },
  },
  4: {
    again: { newLevel: 3, intervalMinutes: 1 },
    hard:  { newLevel: 3, intervalMinutes: 3 },
    good:  { newLevel: 5, intervalMinutes: 7 },
    easy:  { newLevel: 6, intervalMinutes: 10 },
  },
  5: {
    again: { newLevel: 4, intervalMinutes: 1 },
    hard:  { newLevel: 4, intervalMinutes: 3 },
    good:  { newLevel: 6, intervalMinutes: 7 },
    easy:  { newLevel: 6, intervalMinutes: 10 },
  },
  6: {
    again: { newLevel: 5, intervalMinutes: 1 },
    hard:  { newLevel: 5, intervalMinutes: 3 },
    good:  { newLevel: 6, intervalMinutes: 7 },
    easy:  { newLevel: 6, intervalMinutes: 10 },
  },
};

export function computeSRSTransition(level: number, rating: SRSRating) {
  const clampedLevel = Math.max(0, Math.min(6, level));
  return SRS_TABLE[clampedLevel][rating];
}

export function getNextReviewTimestamp(transition: Transition): number {
  const now = Date.now();
  if (transition.intervalMinutes !== undefined) {
    return now + transition.intervalMinutes * 60 * 1000;
  }
  return now + (transition.intervalDays || 1) * 24 * 60 * 60 * 1000;
}

export function formatInterval(transition: Transition): string {
  if (transition.intervalMinutes !== undefined) {
    return `${transition.intervalMinutes} min`;
  }
  const d = transition.intervalDays || 1;
  if (d === 1) return "1 jour";
  if (d < 7) return `${d} jours`;
  if (d === 7) return "1 sem.";
  if (d === 21) return "3 sem.";
  if (d === 30) return "1 mois";
  if (d === 60) return "2 mois";
  return `${d} jours`;
}

/** Get preview labels for all 4 buttons given a card's current level */
export function getButtonPreviews(level: number) {
  const ratings: SRSRating[] = ["again", "hard", "good", "easy"];
  return ratings.map(r => {
    const t = computeSRSTransition(level, r);
    const isAgain = r === "again";
    return {
      rating: r,
      label: r === "again" ? "À revoir" : r === "hard" ? "Difficile" : r === "good" ? "Moyen" : "Facile",
      sub: isAgain ? "Prochaine session" : formatInterval(t),
    };
  });
}

// ─── localStorage persistence ────────────────────

export function getSRSStorageKey(deckId: string) {
  return `medflow_srs_${deckId}`;
}

export function loadSRSState(deckId: string): Record<string, SRSCardState> {
  try {
    const raw = localStorage.getItem(getSRSStorageKey(deckId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSRSState(deckId: string, state: Record<string, SRSCardState>) {
  localStorage.setItem(getSRSStorageKey(deckId), JSON.stringify(state));
}

export function getCardState(deckId: string, cardId: string): SRSCardState {
  const all = loadSRSState(deckId);
  return all[cardId] || { level: 0, interval: 0, lastRating: null, nextReview: 0, reviewCount: 0 };
}

export function updateCardState(
  deckId: string,
  cardId: string,
  rating: SRSRating,
): { newState: SRSCardState; regressed: boolean; oldLevel: number } {
  const all = loadSRSState(deckId);
  const current = all[cardId] || { level: 0, interval: 0, lastRating: null, nextReview: 0, reviewCount: 0 };
  const oldLevel = current.level;
  const transition = computeSRSTransition(current.level, rating);
  const nextReview = getNextReviewTimestamp(transition);

  const newState: SRSCardState = {
    level: transition.newLevel,
    interval: transition.intervalMinutes ?? (transition.intervalDays! * 24 * 60),
    lastRating: rating,
    nextReview,
    reviewCount: current.reviewCount + 1,
  };

  all[cardId] = newState;
  saveSRSState(deckId, all);

  return { newState, regressed: transition.newLevel < oldLevel, oldLevel };
}

/** Get due cards from a list of card IDs for a deck */
export function getDueCardIds(deckId: string, cardIds: string[]): string[] {
  const all = loadSRSState(deckId);
  const now = Date.now();
  return cardIds.filter(id => {
    const state = all[id];
    if (!state) return true; // never seen = due
    return state.nextReview <= now;
  });
}

/** Count cards at each level */
export function getLevelDistribution(deckId: string, cardIds: string[]): number[] {
  const all = loadSRSState(deckId);
  const dist = [0, 0, 0, 0, 0, 0, 0]; // levels 0-6
  cardIds.forEach(id => {
    const level = all[id]?.level ?? 0;
    dist[level]++;
  });
  return dist;
}
