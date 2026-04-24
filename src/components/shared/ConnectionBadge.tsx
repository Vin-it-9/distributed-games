"use client";

import { useGameStore } from "@/lib/store/game-store";

export function ConnectionBadge() {
  const connected = useGameStore((s) => s.connected);
  return (
    <span className={connected ? "chip chip-good" : "chip chip-bad"}>
      ws {connected ? "online" : "offline"}
    </span>
  );
}
