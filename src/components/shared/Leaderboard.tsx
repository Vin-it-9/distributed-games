"use client";

import type { LeaderboardEntry } from "@/lib/game/types";

export function Leaderboard({
  entries,
  highlightId,
}: {
  entries: LeaderboardEntry[];
  highlightId?: string;
}) {
  if (entries.length === 0) {
    return <div className="text-slate-400">no players yet</div>;
  }
  return (
    <ol className="space-y-1">
      {entries.map((e, i) => (
        <li
          key={e.playerId}
          className={`flex items-center justify-between rounded border px-2 py-1 ${
            e.playerId === highlightId
              ? "border-accent/50 bg-[#19213a]"
              : "border-border"
          }`}
        >
          <span className="truncate">
            <span className="mr-2 text-slate-400">#{i + 1}</span>
            {e.name}
          </span>
          <span className="font-semibold text-slate-200">{e.score}</span>
        </li>
      ))}
    </ol>
  );
}
