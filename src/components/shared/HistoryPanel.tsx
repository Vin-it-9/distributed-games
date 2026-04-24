"use client";

import type { PublicRoomState } from "@/lib/game/types";
import { Icon } from "./Icon";

export function HistoryPanel({ room }: { room: PublicRoomState }) {
  if (room.history.length === 0) {
    return <div className="text-gh-muted text-xs">no rounds played yet</div>;
  }
  return (
    <ol className="space-y-2">
      {room.history.map((h) => {
        if (h.kind === "quiz") {
          return (
            <li
              key={`q-${h.roundNumber}`}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="chip">
                  <Icon name="quiz" size={10} /> r{h.roundNumber}
                </span>
                <span className="line-clamp-1 flex-1 text-gh-fg">
                  {h.prompt}
                </span>
              </div>
              <div className="mt-1 text-gh-green">
                <Icon name="check" size={12} /> {h.choices[h.correctIndex]}
              </div>
              <div className="mt-0.5 text-gh-muted">
                {h.answers.filter((a) => a.correct).length}/{h.answers.length}{" "}
                correct
              </div>
            </li>
          );
        }
        if (h.kind === "guess") {
          return (
            <li
              key={`g-${h.roundNumber}`}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="chip">
                  <Icon name="casino" size={10} /> r{h.roundNumber}
                </span>
                <span className="text-gh-muted">
                  target:{" "}
                  <span className="text-gh-fg mono-tight font-semibold">
                    {h.target}
                  </span>
                </span>
              </div>
              {h.winnerName ? (
                <div className="mt-1 text-gh-green">
                  🏆 {h.winnerName} · {h.winningGuess} ({h.winnerReason})
                </div>
              ) : (
                <div className="mt-1 text-gh-muted">no winner</div>
              )}
            </li>
          );
        }
        const iconMap = { math: "calculate", scramble: "shuffle", emoji: "sentiment_satisfied" };
        return (
          <li
            key={`${h.kind}-${h.roundNumber}`}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="chip">
                <Icon name={iconMap[h.kind]} size={10} /> r{h.roundNumber}
              </span>
              <span className="text-gh-muted line-clamp-1 flex-1 mono-tight">
                {h.prompt}
              </span>
            </div>
            <div className="mt-1 text-gh-accent">
              answer: {h.revealAnswer}
            </div>
            {h.winnerName ? (
              <div className="text-gh-green">🏆 {h.winnerName}</div>
            ) : (
              <div className="text-gh-muted">no winner</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
