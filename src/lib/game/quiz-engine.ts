import { pickRandomQuestion } from "@/lib/data/questions";
import { quizScore } from "./fairness";
import type { QuizRound, RoundHistoryEntry } from "./types";
import type { RoomState } from "./room-store";

export const QUIZ_ROUND_MS = 15_000;
export const QUIZ_TOTAL_ROUNDS = 5;

export function startQuizRound(room: RoomState): QuizRound | null {
  const question = pickRandomQuestion(room.usedQuestionIds);
  if (!question) return null;
  room.usedQuestionIds.add(question.id);
  room.roundNumber += 1;
  const startedAt = Date.now();
  const round: QuizRound = {
    kind: "quiz",
    roundNumber: room.roundNumber,
    question,
    startedAt,
    endsAt: startedAt + QUIZ_ROUND_MS,
    durationMs: QUIZ_ROUND_MS,
    answers: {},
  };
  room.currentRound = round;
  room.status = "in-round";
  return round;
}

// Returns true if the answer was accepted, false if duplicate / late / invalid.
export function submitQuizAnswer(
  room: RoomState,
  playerId: string,
  choiceIndex: number,
  at: number
): { accepted: boolean; reason?: string } {
  const round = room.currentRound;
  if (!round || round.kind !== "quiz") return { accepted: false, reason: "no-round" };
  if (room.status !== "in-round") return { accepted: false, reason: "not-live" };
  if (at > round.endsAt) return { accepted: false, reason: "late" };
  if (round.answers[playerId]) return { accepted: false, reason: "duplicate" };
  if (!Number.isInteger(choiceIndex)) return { accepted: false, reason: "invalid" };
  if (choiceIndex < 0 || choiceIndex >= round.question.choices.length) {
    return { accepted: false, reason: "out-of-range" };
  }
  round.answers[playerId] = { choiceIndex, at };
  return { accepted: true };
}

export function finalizeQuizRound(room: RoomState): RoundHistoryEntry | null {
  const round = room.currentRound;
  if (!round || round.kind !== "quiz") return null;
  round.correctIndex = round.question.correctIndex;

  // Score every answer centrally.
  for (const [playerId, answer] of Object.entries(round.answers)) {
    const player = room.players.get(playerId);
    if (!player) continue;
    const correct = answer.choiceIndex === round.question.correctIndex;
    player.score += quizScore(correct, answer.at, round.startedAt, round.durationMs);
  }

  const history: RoundHistoryEntry = {
    kind: "quiz",
    roundNumber: round.roundNumber,
    prompt: round.question.prompt,
    choices: round.question.choices,
    correctIndex: round.question.correctIndex,
    answers: Object.entries(round.answers).map(([pid, a]) => {
      const p = room.players.get(pid);
      return {
        playerId: pid,
        name: p?.name ?? "unknown",
        choiceIndex: a.choiceIndex,
        correct: a.choiceIndex === round.question.correctIndex,
      };
    }),
  };
  room.history.push(history);
  room.status = "round-ended";
  return history;
}

export function isQuizGameFinished(room: RoomState): boolean {
  return room.mode === "quiz" && room.roundNumber >= QUIZ_TOTAL_ROUNDS;
}
