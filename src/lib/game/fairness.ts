import type { GuessRound } from "./types";

// Server-side fairness rules live here so they stay out of the UI.
// The browser may show a guess "sent first", but only the server decides.

export function resolveGuessWinner(
  round: GuessRound
): { winnerId?: string; winningGuess?: number; reason?: "exact" | "nearest" } {
  if (round.guesses.length === 0) return {};

  // 1. First exact match, by server arrival order (stable).
  //    The array is already appended in arrival order by the engine.
  const exact = round.guesses.find((g) => g.value === round.target);
  if (exact) {
    return { winnerId: exact.playerId, winningGuess: exact.value, reason: "exact" };
  }

  // 2. Otherwise, nearest guess. Ties break by earliest server receipt.
  let best = round.guesses[0];
  let bestDelta = Math.abs(best.value - round.target);
  for (let i = 1; i < round.guesses.length; i++) {
    const g = round.guesses[i];
    const d = Math.abs(g.value - round.target);
    if (d < bestDelta || (d === bestDelta && g.at < best.at)) {
      best = g;
      bestDelta = d;
    }
  }
  return { winnerId: best.playerId, winningGuess: best.value, reason: "nearest" };
}

// Quiz scoring: correctness + speed bonus.
// Returns integer score for this answer (0 if wrong).
export function quizScore(
  correct: boolean,
  submittedAt: number,
  startedAt: number,
  durationMs: number
): number {
  if (!correct) return 0;
  const elapsed = Math.max(0, submittedAt - startedAt);
  const remaining = Math.max(0, durationMs - elapsed);
  const base = 100;
  const speedBonus = Math.round((remaining / durationMs) * 100);
  return base + speedBonus;
}
