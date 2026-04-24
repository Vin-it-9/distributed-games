// Shared in-memory domain models. Server is the source of truth.
// These types cross the wire, so keep them JSON-serializable (no Map on the wire).

export type GameMode = "quiz" | "guess";

export type RoomStatus =
  | "lobby"
  | "in-round"
  | "round-ended"
  | "finished";

export type Player = {
  id: string;
  name: string;
  score: number;
  connected: boolean;
  joinedAt: number;
  isHost: boolean;
};

// ---------- Quiz ----------
export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  // correctIndex is never sent to clients while the round is live.
  correctIndex: number;
};

export type QuizRound = {
  kind: "quiz";
  roundNumber: number;
  question: QuizQuestion;
  startedAt: number;
  endsAt: number;
  durationMs: number;
  answers: Record<string, { choiceIndex: number; at: number }>;
  // revealed once the round ends
  correctIndex?: number;
};

// Question as sent to clients during an active round (answer hidden).
export type PublicQuizQuestion = Omit<QuizQuestion, "correctIndex">;

// ---------- Guess ----------
export type GuessRound = {
  kind: "guess";
  roundNumber: number;
  min: number;
  max: number;
  target: number; // server-only
  startedAt: number;
  endsAt: number;
  durationMs: number;
  guesses: Array<{
    playerId: string;
    value: number;
    at: number;
  }>;
  winnerId?: string;
  winnerReason?: "exact" | "nearest";
  winningGuess?: number;
};

// Client-visible guess round (target hidden until end).
export type PublicGuessRound = Omit<GuessRound, "target"> & {
  target?: number; // set only after round ends
};

// ---------- Room ----------
export type LeaderboardEntry = {
  playerId: string;
  name: string;
  score: number;
};

export type RoundHistoryEntry =
  | {
      kind: "quiz";
      roundNumber: number;
      prompt: string;
      choices: string[];
      correctIndex: number;
      answers: Array<{ playerId: string; name: string; choiceIndex: number; correct: boolean }>;
    }
  | {
      kind: "guess";
      roundNumber: number;
      min: number;
      max: number;
      target: number;
      winnerId?: string;
      winnerName?: string;
      winnerReason?: "exact" | "nearest";
      winningGuess?: number;
      guesses: Array<{ playerId: string; name: string; value: number; at: number }>;
    };

// Room state as broadcast to clients (target/correctIndex stripped during live play).
export type PublicRoomState = {
  roomId: string;
  hostId: string;
  mode: GameMode;
  status: RoomStatus;
  roundNumber: number;
  players: Player[];
  leaderboard: LeaderboardEntry[];
  currentRound?:
    | {
        kind: "quiz";
        roundNumber: number;
        question: PublicQuizQuestion;
        startedAt: number;
        endsAt: number;
        durationMs: number;
        answeredPlayerIds: string[];
        correctIndex?: number;
      }
    | {
        kind: "guess";
        roundNumber: number;
        min: number;
        max: number;
        startedAt: number;
        endsAt: number;
        durationMs: number;
        guessCount: number;
        target?: number;
        winnerId?: string;
        winnerReason?: "exact" | "nearest";
        winningGuess?: number;
      };
  history: RoundHistoryEntry[];
};
