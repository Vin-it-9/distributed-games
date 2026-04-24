"use client";

import type { LeaderboardEntry } from "@/lib/game/types";
import { Icon } from "./Icon";

export function Leaderboard({
  entries,
  highlightId,
}: {
  entries: LeaderboardEntry[];
  highlightId?: string;
}) {
  if (entries.length === 0) {
    return <div className="text-gh-muted text-xs">no players yet</div>;
  }
  return (
    <ol className="space-y-1">
      {entries.map((e, i) => {
        const medal =
          i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
        return (
          <li
            key={e.playerId}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
              e.playerId === highlightId
                ? "border-gh-accent/50 bg-gh-accent/10"
                : "border-white/5 bg-white/[0.02]"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="w-6 text-xs text-gh-muted tabular-nums">
                {medal}
              </span>
              <span className="truncate font-medium">{e.name}</span>
              {e.playerId === highlightId && (
                <span className="chip chip-accent text-[10px]">you</span>
              )}
            </span>
            <span className="flex items-center gap-1 font-semibold tabular-nums">
              {e.score}
              <Icon name="stars" size={12} className="text-gh-amber" />
            </span>
          </li>
        );
      })}
    </ol>
  );
}
