"use client";

import { useEffect, useState } from "react";
import type { PublicRoomState } from "@/lib/game/types";
import { TimerBar } from "@/components/shared/TimerBar";
import { Icon } from "@/components/shared/Icon";

// Shared panel for math / scramble / emoji modes. Typed-answer race.
export function RacePanel({
  room,
  selfId,
  onSubmit,
}: {
  room: PublicRoomState;
  selfId: string;
  onSubmit: (text: string, cb?: (ok: boolean) => void) => void;
}) {
  const round =
    room.currentRound &&
    (room.currentRound.kind === "math" ||
      room.currentRound.kind === "scramble" ||
      room.currentRound.kind === "emoji")
      ? room.currentRound
      : null;

  const [value, setValue] = useState("");
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);

  // Clear the input whenever the round changes.
  useEffect(() => {
    setValue("");
    setFlash(null);
  }, [round?.roundNumber, round?.kind]);

  if (!round) {
    return <div className="glass p-5 text-gh-muted">waiting for round…</div>;
  }

  const isEnded = room.status === "round-ended" || room.status === "finished";
  const alreadySubmitted = round.submittedPlayerIds.includes(selfId);
  const iWasWrong = round.wrongPlayerIds.includes(selfId);
  const iWon = round.winnerId === selfId;
  const winnerName =
    round.winnerId && room.players.find((p) => p.id === round.winnerId)?.name;

  // Style prompt differently per mode.
  const isEmoji = round.kind === "emoji";
  const isMath = round.kind === "math";
  const isScramble = round.kind === "scramble";

  function submit() {
    const text = value.trim();
    if (!text || alreadySubmitted || isEnded) return;
    onSubmit(text, (ok) => {
      setFlash(ok ? "ok" : "bad");
      setTimeout(() => setFlash(null), 900);
    });
  }

  return (
    <div className="glass p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="chip chip-accent">
          <Icon name="flag" size={12} /> round {round.roundNumber}/
          {room.totalRounds}
        </span>
        <span className="chip">
          <Icon name="keyboard" size={12} /> {round.submittedPlayerIds.length}/
          {room.players.length} answered
        </span>
      </div>
      <TimerBar endsAt={round.endsAt} durationMs={round.durationMs} />

      <div className="mt-5 glass-subtle p-5 text-center">
        <div className="label">
          {isMath
            ? "solve the problem"
            : isScramble
              ? "unscramble the word"
              : "decode the emoji"}
        </div>
        <div
          className={`mt-3 font-semibold tabular-nums ${
            isEmoji
              ? "text-4xl md:text-5xl leading-none"
              : isScramble
                ? "text-4xl mono-tight tracking-[0.25em]"
                : "text-4xl mono-tight"
          }`}
        >
          {round.prompt}
        </div>
        {round.subtitle && (
          <div className="mt-2 text-xs text-gh-muted">{round.subtitle}</div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className={`fld ${isMath ? "text-center mono-tight tabular-nums text-lg" : ""} ${
            flash === "ok"
              ? "!border-gh-green !shadow-[0_0_0_3px_rgba(63,185,80,0.3)]"
              : flash === "bad"
                ? "!border-gh-red !shadow-[0_0_0_3px_rgba(248,81,73,0.3)]"
                : ""
          }`}
          inputMode={isMath ? "numeric" : "text"}
          autoFocus
          value={value}
          disabled={alreadySubmitted || isEnded}
          placeholder={
            isMath
              ? "answer"
              : isScramble
                ? "the original word"
                : "movie or phrase"
          }
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          maxLength={80}
        />
        <button
          className="btn btn-primary"
          disabled={alreadySubmitted || isEnded || !value.trim()}
          onClick={submit}
        >
          <Icon name="send" size={16} /> submit
        </button>
      </div>

      {/* feedback strip */}
      <div className="mt-3 text-xs text-gh-muted flex items-center gap-1.5">
        {alreadySubmitted && !isEnded && !iWon && (
          <>
            <Icon name="lock" size={14} /> your answer was submitted
            {iWasWrong && " — wrong, no retries"}
          </>
        )}
        {!alreadySubmitted && !isEnded && (
          <>
            <Icon name="bolt" size={14} /> first correct submission wins the
            round
          </>
        )}
        {isEnded && (
          <>
            <Icon name="emoji_events" size={14} />
            {winnerName
              ? `${winnerName} won with "${round.winningText}"`
              : "no correct answers"}
            {round.revealAnswer && (
              <span className="ml-2 chip chip-accent">
                answer: {round.revealAnswer}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
