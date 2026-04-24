"use client";

import { create } from "zustand";
import type { PublicRoomState, LeaderboardEntry } from "@/lib/game/types";

type Session = {
  roomId: string;
  playerId: string;
  sessionToken: string;
};

type GameStore = {
  connected: boolean;
  setConnected: (c: boolean) => void;

  session: Session | null;
  setSession: (s: Session | null) => void;

  room: PublicRoomState | null;
  setRoom: (r: PublicRoomState | null) => void;

  leaderboard: LeaderboardEntry[];
  setLeaderboard: (lb: LeaderboardEntry[]) => void;

  timerEndsAt: number | null;
  timerNow: number | null;
  setTimer: (endsAt: number | null, now: number | null) => void;

  errorMessage: string | null;
  setError: (msg: string | null) => void;

  hydrateSessionFromStorage: () => Session | null;
  persistSession: (s: Session) => void;
  clearSession: () => void;
};

const STORAGE_KEY = "dg.session";

export const useGameStore = create<GameStore>((set) => ({
  connected: false,
  setConnected: (c) => set({ connected: c }),

  session: null,
  setSession: (s) => set({ session: s }),

  room: null,
  setRoom: (r) => set({ room: r }),

  leaderboard: [],
  setLeaderboard: (lb) => set({ leaderboard: lb }),

  timerEndsAt: null,
  timerNow: null,
  setTimer: (endsAt, now) => set({ timerEndsAt: endsAt, timerNow: now }),

  errorMessage: null,
  setError: (msg) => set({ errorMessage: msg }),

  hydrateSessionFromStorage: () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Session;
      set({ session: parsed });
      return parsed;
    } catch {
      return null;
    }
  },
  persistSession: (s) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    set({ session: s });
  },
  clearSession: () => {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    set({ session: null });
  },
}));
