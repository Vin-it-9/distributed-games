"use client";

import { useGameStore } from "@/lib/store/game-store";
import { Icon } from "./Icon";

export function ConnectionBadge() {
  const connected = useGameStore((s) => s.connected);
  return (
    <span className={connected ? "chip chip-good" : "chip chip-bad"}>
      <Icon name={connected ? "wifi" : "wifi_off"} size={12} />{" "}
      {connected ? "online" : "offline"}
    </span>
  );
}
