"use client";

import type { PublicRoomState } from "@/lib/game/types";

export function HistoryPanel({ room }: { room: PublicRoomState }) {
  if (room.history.length === 0) {
    return <div className="text-slate-400">no rounds played yet</div>;
  }
  return (
    <ol className="space-y-2">
      {room.history.map((h) => {
        if (h.kind === "quiz") {
          return (
            <li
              key={`q-${h.roundNumber}`}
              className="rounded border border-border bg-[#0e1420] p-2 text-xs"
            >
              <div className="label">round {h.roundNumber} · quiz</div>
              <div className="mt-1 line-clamp-2 text-slate-300">{h.prompt}</div>
              <div className="mt-1 text-good">
                correct: {h.choices[h.correctIndex]}
              </div>
              <div className="mt-1 text-slate-400">
                {h.answers.filter((a) => a.correct).length}/{h.answers.length}{" "}
                correct
              </div>
            </li>
          );
        }
        return (
          <li
            key={`g-${h.roundNumber}`}
            className="rounded border border-border bg-[#0e1420] p-2 text-xs"
          >
            <div className="label">round {h.roundNumber} · guess</div>
            <div className="mt-1 text-slate-300">
              target: <span className="font-semibold">{h.target}</span>
            </div>
            {h.winnerName ? (
              <div className="text-good">
                {h.winnerName} won with {h.winningGuess} ({h.winnerReason})
              </div>
            ) : (
              <div className="text-slate-400">no winner</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
