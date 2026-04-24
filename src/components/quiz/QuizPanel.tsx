"use client";

import { useMemo, useState } from "react";
import type { PublicRoomState } from "@/lib/game/types";
import { TimerBar } from "@/components/shared/TimerBar";

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
    return <div className="panel">waiting for question…</div>;
  }

  return (
    <div className="panel">
      <div className="mb-2 flex items-center justify-between">
        <span className="label">
          round {round.roundNumber} · quiz
        </span>
        <span className="chip">
          {round.answeredPlayerIds.length}/{room.players.length} answered
        </span>
      </div>
      <TimerBar endsAt={round.endsAt} durationMs={round.durationMs} />
      <h3 className="mt-4 mb-3 text-base font-semibold leading-snug">
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
              className={`btn justify-start text-left ${
                isCorrect
                  ? "border-good bg-[#0f2a1d]"
                  : selected
                    ? "border-accent"
                    : ""
              }`}
            >
              <span className="mr-2 text-slate-400">
                {String.fromCharCode(65 + i)}.
              </span>
              {c}
            </button>
          );
        })}
      </div>
      <div className="mt-3 label">
        {isEnded
          ? "round ended — waiting for host to advance"
          : alreadyAnswered
            ? "answer locked in — waiting for timeout"
            : "pick an answer — only the first submission counts"}
      </div>
    </div>
  );
}
