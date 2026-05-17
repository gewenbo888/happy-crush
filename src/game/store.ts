"use client";

import { create } from "zustand";
import type { Lang } from "./i18n";

interface LevelRecord {
  bestScore: number;
  stars: 0 | 1 | 2 | 3;
}

interface GameState {
  lang: Lang;
  setLang: (l: Lang) => void;

  screen: "landing" | "select" | "game" | "leaderboard";
  setScreen: (s: GameState["screen"]) => void;

  currentLevel: number;
  setCurrentLevel: (n: number) => void;

  records: Record<number, LevelRecord>;
  setRecord: (level: number, r: LevelRecord) => void;

  xp: number;
  coins: number;
  addXp: (n: number) => void;
  addCoins: (n: number) => void;

  muted: boolean;
  toggleMuted: () => void;

  /* difficulty adapter (very lightweight "AI") — tracks recent fail/win to
     adjust starThreshold leniency on the fly. */
  recentLosses: number;
  recentWins: number;
  recordOutcome: (win: boolean) => void;
}

const isBrowser = typeof window !== "undefined";

const readLS = <T>(k: string, fallback: T): T => {
  if (!isBrowser) return fallback;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeLS = (k: string, v: unknown) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};

export const useGame = create<GameState>((set, get) => ({
  lang: readLS<Lang>("hc.lang", "en"),
  setLang: (lang) => {
    writeLS("hc.lang", lang);
    set({ lang });
  },

  screen: "landing",
  setScreen: (screen) => set({ screen }),

  currentLevel: readLS<number>("hc.lastLevel", 1),
  setCurrentLevel: (currentLevel) => {
    writeLS("hc.lastLevel", currentLevel);
    set({ currentLevel });
  },

  records: readLS<Record<number, LevelRecord>>("hc.records", {}),
  setRecord: (level, r) => {
    const prev = get().records[level];
    if (!prev || r.bestScore > prev.bestScore || r.stars > prev.stars) {
      const next = { ...get().records, [level]: r };
      writeLS("hc.records", next);
      set({ records: next });
    }
  },

  xp: readLS<number>("hc.xp", 0),
  coins: readLS<number>("hc.coins", 50),
  addXp: (n) => {
    const xp = get().xp + n;
    writeLS("hc.xp", xp);
    set({ xp });
  },
  addCoins: (n) => {
    const coins = Math.max(0, get().coins + n);
    writeLS("hc.coins", coins);
    set({ coins });
  },

  muted: readLS<boolean>("hc.muted", false),
  toggleMuted: () => {
    const muted = !get().muted;
    writeLS("hc.muted", muted);
    set({ muted });
  },

  recentLosses: 0,
  recentWins: 0,
  recordOutcome: (win) =>
    set((s) => ({
      recentLosses: win ? Math.max(0, s.recentLosses - 1) : s.recentLosses + 1,
      recentWins: win ? s.recentWins + 1 : Math.max(0, s.recentWins - 1),
    })),
}));

/** Adaptive difficulty: gives a small move bonus if the player is losing repeatedly. */
export function adaptiveMoveBonus(s: GameState): number {
  if (s.recentLosses >= 3) return 3;
  if (s.recentLosses >= 2) return 2;
  if (s.recentLosses >= 1) return 1;
  return 0;
}
