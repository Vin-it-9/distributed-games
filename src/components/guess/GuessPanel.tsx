"use client";

import { useState } from "react";
import type { PublicRoomState } from "@/lib/game/types";
import { TimerBar } from "@/components/shared/TimerBar";

export function GuessPanel({
  room,
  onSubmit,
}: {
  room: PublicRoomState;
  onSubmit: (value: number) => void;
}) {
  const round = room.currentRound?.kind === "guess" ? room.currentRound : null;
  const [value, setValue] = useState("");

  if (!round) {
    return <div className="panel">waiting for round…</div>;
  }

  const isEnded = room.status === "round-ended" || room.status === "finished";

  function submit() {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    onSubmit(Math.floor(n));
    setValue("");
  }

  return (
    <div className="panel">
      <div className="mb-2 flex items-center justify-between">
        <span className="label">round {round.roundNumber} · guess</span>
        <span className="chip">
          {round.guessCount} guesses submitted
        </span>
      </div>
      <TimerBar endsAt={round.endsAt} durationMs={round.durationMs} />

      <div className="mt-4 rounded border border-border bg-[#0e1420] p-3">
        <div className="label">pick a number</div>
        <div className="mt-1 text-sm text-slate-300">
          between <span className="font-semibold">{round.min}</span> and{" "}
          <span className="font-semibold">{round.max}</span>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="fld"
          type="number"
          min={round.min}
          max={round.max}
          value={value}
          disabled={isEnded}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="your guess"
        />
        <button
          className="btn btn-primary"
          onClick={submit}
          disabled={isEnded || value === ""}
        >
          submit
        </button>
      </div>

      {isEnded && (
        <div className="mt-4 rounded border border-border bg-[#141b2c] p-3">
          <div className="label">round result</div>
          <div className="mt-1">
            target was <span className="font-semibold">{round.target}</span>
          </div>
          {round.winnerId ? (
            <div className="text-good">
              winner: {room.players.find((p) => p.id === round.winnerId)?.name}{" "}
              with {round.winningGuess} (
              {round.winnerReason === "exact" ? "exact match" : "nearest guess"}
              )
            </div>
          ) : (
            <div className="text-slate-400">no valid guesses</div>
          )}
        </div>
      )}

      <div className="mt-3 label">
        server resolves the winner by arrival order. your submit time in the UI
        is not authoritative.
      </div>
    </div>
  );
}
