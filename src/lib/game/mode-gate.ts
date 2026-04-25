import type { GameMode } from "@/lib/game/types";
import { GAME_MODES } from "@/lib/game/types";

const DEFAULT_AVAILABLE_MODES: GameMode[] = ["math"];

let allModesUnlocked = false;

export function getAvailableModes(): GameMode[] {
  return allModesUnlocked ? [...GAME_MODES] : [...DEFAULT_AVAILABLE_MODES];
}

export function isModeAvailable(mode: GameMode): boolean {
  return getAvailableModes().includes(mode);
}

export function unlockAllModes(): void {
  allModesUnlocked = true;
}

export function lockToDefaultModes(): void {
  allModesUnlocked = false;
}

export function areAllModesUnlocked(): boolean {
  return allModesUnlocked;
}
