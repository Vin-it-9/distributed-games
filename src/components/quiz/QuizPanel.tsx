"use client";

import { useMemo, useState } from "react";
import type { PublicRoomState } from "@/lib/game/types";
import { TimerBar } from "@/components/shared/TimerBar";
import { Icon } from "@/components/shared/Icon";

export function QuizPanel({
  room,
  selfId,
  onSubmit,
}: {
  room: PublicRoomState;
  selfId: string;
  onSubmit: (choiceIndex: number) => void;
}) {
  const round = room.currentRound?.kind === "quiz" ? room.currentRound : null;
  const [picked, setPicked] = useState<number | null>(null);

  const alreadyAnswered = useMemo(
    () => !!round?.answeredPlayerIds.includes(selfId),
    [round, selfId]
  );
  const isEnded = room.status === "round-ended" || room.status === "finished";

  if (!round) {
    return <div className="glass p-5 text-gh-muted">waiting for question…</div>;
  }

  return (
    <div className="glass p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="chip chip-accent">
          <Icon name="flag" size={12} /> round {round.roundNumber}/
          {room.totalRounds}
        </span>
        <span className="chip">
          <Icon name="how_to_vote" size={12} />
          {round.answeredPlayerIds.length}/{room.players.length} answered
        </span>
      </div>
      <TimerBar endsAt={round.endsAt} durationMs={round.durationMs} />

      <h3 className="mt-5 mb-4 text-[15px] font-semibold leading-snug">
        {round.question.prompt}
      </h3>

      <div className="grid gap-2">
        {round.question.choices.map((c, i) => {
          const isCorrect = isEnded && round.correctIndex === i;
          const selected = picked === i;
          return (
            <button
              key={i}
              disabled={alreadyAnswered || isEnded}
              onClick={() => {
                setPicked(i);
                onSubmit(i);
              }}
              className={`btn justify-start text-left py-3 ${
                isCorrect
                  ? "!border-gh-green !bg-gh-green/15"
                  : selected
                    ? "!border-gh-accent"
                    : ""
              }`}
            >
              <span className="mr-2 inline-grid h-5 w-5 place-items-center rounded bg-white/10 text-[11px] font-semibold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 whitespace-normal">{c}</span>
              {isCorrect && (
                <Icon name="check_circle" size={16} className="text-gh-green" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gh-muted flex items-center gap-1.5">
        <Icon name="info" size={14} />
        {isEnded
          ? "round ended — host advances to next round"
          : alreadyAnswered
            ? "answer locked in — waiting for timeout"
            : "pick an answer — only the first submission counts"}
      </div>
    </div>
  );
}
