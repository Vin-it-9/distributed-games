import type { RaceKind, RaceRound, RoundHistoryEntry } from "./types";
import type { RoomState } from "./room-store";
import { generateMathProblem } from "@/lib/data/math";
import { pickRandomWord, scrambleWord } from "@/lib/data/words";
import { normalizeAnswer, pickRandomEmoji } from "@/lib/data/emoji";

export const RACE_ROUND_MS = 20_000;
export const RACE_TOTAL_ROUNDS = 5;
export const RACE_BASE_POINTS = 100;

// Build a new race round for the given kind. Returns null if no content left.
export function startRaceRound(room: RoomState, kind: RaceKind): RaceRound | null {
  let prompt = "";
  let subtitle: string | undefined;
  let answers: string[] = [];
  let usedKey: string | null = null;

  if (kind === "math") {
    const p = generateMathProblem(room.roundNumber < 1 ? "easy" : "medium");
    prompt = p.prompt;
    subtitle = "type the integer answer";
    answers = [String(p.answer)];
    usedKey = p.id;
  } else if (kind === "scramble") {
    const word = pickRandomWord(room.usedQuestionIds);
    if (!word) return null;
    usedKey = word;
    prompt = scrambleWord(word).toUpperCase();
    subtitle = `${word.length} letters`;
    answers = [word];
  } else {
    const puzzle = pickRandomEmoji(room.usedQuestionIds);
    if (!puzzle) return null;
    usedKey = puzzle.id;
    prompt = puzzle.prompt;
    subtitle = puzzle.hint;
    answers = [puzzle.answer, ...(puzzle.aliases ?? [])];
  }

  if (usedKey) room.usedQuestionIds.add(usedKey);
  room.roundNumber += 1;

  const startedAt = Date.now();
  const round: RaceRound = {
    kind,
    roundNumber: room.roundNumber,
    prompt,
    subtitle,
    answers: answers.map((a) => normalizeAnswer(a)),
    submissions: {},
    startedAt,
    endsAt: startedAt + RACE_ROUND_MS,
    durationMs: RACE_ROUND_MS,
  };
  // Stash canonical human-readable answer for reveal.
  round.revealAnswer = answers[0];
  room.currentRound = round;
  room.status = "in-round";
  return round;
}

// Returns { accepted, correct, winNow, reason }.
// First correct submission wins the round immediately. Wrong submissions are
// recorded but the player can't retry (prevents brute-forcing).
export function submitRaceAnswer(
  room: RoomState,
  playerId: string,
  text: string,
  at: number
): { accepted: boolean; correct: boolean; winNow: boolean; reason?: string } {
  const round = room.currentRound;
  if (!round || (round.kind !== "math" && round.kind !== "scramble" && round.kind !== "emoji")) {
    return { accepted: false, correct: false, winNow: false, reason: "no-round" };
  }
  if (room.status !== "in-round") {
    return { accepted: false, correct: false, winNow: false, reason: "not-live" };
  }
  if (at > round.endsAt) {
    return { accepted: false, correct: false, winNow: false, reason: "late" };
  }
  if (round.submissions[playerId]) {
    return { accepted: false, correct: false, winNow: false, reason: "already-submitted" };
  }
  const normalized = normalizeAnswer(text);
  if (!normalized) {
    return { accepted: false, correct: false, winNow: false, reason: "empty" };
  }
  const correct = round.answers.includes(normalized);
  round.submissions[playerId] = { text: normalized, correct, at };
  // Instant-win if correct (first correct by arrival order; submissions map
  // entries are created in arrival order on the single-threaded event loop).
  if (correct && !round.winnerId) {
    round.winnerId = playerId;
    round.winningText = normalized;
    return { accepted: true, correct: true, winNow: true };
  }
  return { accepted: true, correct, winNow: false };
}

export function finalizeRaceRound(room: RoomState): RoundHistoryEntry | null {
  const round = room.currentRound;
  if (!round || (round.kind !== "math" && round.kind !== "scramble" && round.kind !== "emoji")) {
    return null;
  }

  if (round.winnerId) {
    const p = room.players.get(round.winnerId);
    if (p) p.score += RACE_BASE_POINTS;
  }
  room.status = "round-ended";

  const history: RoundHistoryEntry = {
    kind: round.kind,
    roundNumber: round.roundNumber,
    prompt: round.prompt,
    revealAnswer: round.revealAnswer ?? round.answers[0],
    winnerId: round.winnerId,
    winnerName: round.winnerId ? room.players.get(round.winnerId)?.name : undefined,
    winningText: round.winningText,
    submissions: Object.entries(round.submissions).map(([pid, s]) => ({
      playerId: pid,
      name: room.players.get(pid)?.name ?? "unknown",
      text: s.text,
      correct: s.correct,
    })),
  };
  room.history.push(history);
  return history;
}

export function isRaceGameFinished(room: RoomState): boolean {
  return (
    (room.mode === "math" || room.mode === "scramble" || room.mode === "emoji") &&
    room.roundNumber >= RACE_TOTAL_ROUNDS
  );
}
