import { resolveGuessWinner } from "./fairness";
import type { GuessRound, RoundHistoryEntry } from "./types";
import type { RoomState } from "./room-store";

export const GUESS_ROUND_MS = 20_000;
export const GUESS_TOTAL_ROUNDS = 3;
export const GUESS_MIN = 1;
export const GUESS_MAX = 100;
export const GUESS_WIN_POINTS = 100;

export function startGuessRound(room: RoomState): GuessRound {
  room.roundNumber += 1;
  const startedAt = Date.now();
  const target = Math.floor(Math.random() * (GUESS_MAX - GUESS_MIN + 1)) + GUESS_MIN;
  const round: GuessRound = {
    kind: "guess",
    roundNumber: room.roundNumber,
    min: GUESS_MIN,
    max: GUESS_MAX,
    target,
    startedAt,
    endsAt: startedAt + GUESS_ROUND_MS,
    durationMs: GUESS_ROUND_MS,
    guesses: [],
  };
  room.currentRound = round;
  room.status = "in-round";
  return round;
}

// submitGuess: appends in server arrival order; rejects invalid/late guesses.
// Returns { accepted, winNow } — if winNow is true, the caller should end the round.
export function submitGuess(
  room: RoomState,
  playerId: string,
  value: number,
  at: number
): { accepted: boolean; winNow: boolean; reason?: string } {
  const round = room.currentRound;
  if (!round || round.kind !== "guess") return { accepted: false, winNow: false, reason: "no-round" };
  if (room.status !== "in-round") return { accepted: false, winNow: false, reason: "not-live" };
  if (at > round.endsAt) return { accepted: false, winNow: false, reason: "late" };
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return { accepted: false, winNow: false, reason: "invalid" };
  }
  if (value < round.min || value > round.max) {
    return { accepted: false, winNow: false, reason: "out-of-range" };
  }
  round.guesses.push({ playerId, value, at });
  // Instant-win: first exact guess ends the round immediately.
  const winNow = value === round.target;
  return { accepted: true, winNow };
}

export function finalizeGuessRound(room: RoomState): RoundHistoryEntry | null {
  const round = room.currentRound;
  if (!round || round.kind !== "guess") return null;

  const { winnerId, winningGuess, reason } = resolveGuessWinner(round);
  if (winnerId) {
    round.winnerId = winnerId;
    round.winningGuess = winningGuess;
    round.winnerReason = reason;
    const p = room.players.get(winnerId);
    if (p) p.score += GUESS_WIN_POINTS;
  }

  const history: RoundHistoryEntry = {
    kind: "guess",
    roundNumber: round.roundNumber,
    min: round.min,
    max: round.max,
    target: round.target,
    winnerId: round.winnerId,
    winnerName: round.winnerId ? room.players.get(round.winnerId)?.name : undefined,
    winnerReason: round.winnerReason,
    winningGuess: round.winningGuess,
    guesses: round.guesses.map((g) => ({
      playerId: g.playerId,
      name: room.players.get(g.playerId)?.name ?? "unknown",
      value: g.value,
      at: g.at,
    })),
  };
  room.history.push(history);
  room.status = "round-ended";
  return history;
}

export function isGuessGameFinished(room: RoomState): boolean {
  return room.mode === "guess" && room.roundNumber >= GUESS_TOTAL_ROUNDS;
}
