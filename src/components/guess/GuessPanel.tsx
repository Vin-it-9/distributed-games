"use client";

import { useState } from "react";
import type { PublicRoomState } from "@/lib/game/types";
import { TimerBar } from "@/components/shared/TimerBar";
import { Icon } from "@/components/shared/Icon";

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
    return <div className="glass p-5 text-gh-muted">waiting for round…</div>;
  }

  const isEnded = room.status === "round-ended" || room.status === "finished";

  function submit() {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    onSubmit(Math.floor(n));
    setValue("");
  }

  const winnerName =
    round.winnerId && room.players.find((p) => p.id === round.winnerId)?.name;

  return (
    <div className="glass p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="chip chip-accent">
          <Icon name="flag" size={12} /> round {round.roundNumber}/
          {room.totalRounds}
        </span>
        <span className="chip">
          <Icon name="send" size={12} /> {round.guessCount} guesses
        </span>
      </div>
      <TimerBar endsAt={round.endsAt} durationMs={round.durationMs} />

      <div className="mt-5 glass-subtle p-4 text-center">
        <div className="label">pick a number between</div>
        <div className="mt-2 text-3xl font-semibold mono-tight tabular-nums">
          <span className="text-gh-accent">{round.min}</span>
          <span className="text-gh-muted mx-3">↔</span>
          <span className="text-gh-accent">{round.max}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="fld mono-tight text-center text-lg tabular-nums"
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
          <Icon name="send" size={16} /> submit
        </button>
      </div>

      {isEnded && (
        <div className="mt-5 glass-subtle p-4">
          <div className="label flex items-center gap-1">
            <Icon name="emoji_events" size={14} /> round result
          </div>
          <div className="mt-2 text-sm">
            target was{" "}
            <span className="font-semibold mono-tight text-gh-accent">
              {round.target}
            </span>
          </div>
          {round.winnerId ? (
            <div className="text-gh-green text-sm mt-1">
              {winnerName} won with {round.winningGuess}
              <span className="ml-2 chip chip-good">
                {round.winnerReason === "exact" ? "exact match" : "nearest"}
              </span>
            </div>
          ) : (
            <div className="text-gh-muted text-sm mt-1">no valid guesses</div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gh-muted flex items-center gap-1.5">
        <Icon name="shield_person" size={14} />
        server resolves the winner by arrival order. client timing is not
        authoritative.
      </div>
    </div>
  );
}
