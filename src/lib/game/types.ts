// Shared in-memory domain models. Server is the source of truth.
// These types cross the wire, so keep them JSON-serializable (no Map on the wire).

export type GameMode = "quiz" | "guess" | "math" | "scramble" | "emoji";

export const GAME_MODES: GameMode[] = ["quiz", "guess", "math", "scramble", "emoji"];

export const GAME_META: Record<
  GameMode,
  { title: string; icon: string; blurb: string; tag: string }
> = {
  quiz: {
    title: "Multiplayer Quiz",
    icon: "quiz",
    blurb: "Answer first, answer fast. Speed bonus on correct picks.",
    tag: "broadcast · timeout",
  },
  guess: {
    title: "Number Guessing",
    icon: "casino",
    blurb: "Guess the secret number. Server resolves ties by arrival order.",
    tag: "concurrency · fairness",
  },
  math: {
    title: "Math Sprint",
    icon: "calculate",
    blurb: "Fast arithmetic. First correct typed answer wins the round.",
    tag: "race · first-correct",
  },
  scramble: {
    title: "Word Scramble",
    icon: "shuffle",
    blurb: "Unscramble the word. First to type the original wins.",
    tag: "race · first-correct",
  },
  emoji: {
    title: "Emoji Decode",
    icon: "sentiment_satisfied",
    blurb: "Decode the movie or phrase hidden in emoji.",
    tag: "race · fuzzy-match",
  },
};

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
  correctIndex: number;
};
export type PublicQuizQuestion = Omit<QuizQuestion, "correctIndex">;

export type QuizRound = {
  kind: "quiz";
  roundNumber: number;
  question: QuizQuestion;
  startedAt: number;
  endsAt: number;
  durationMs: number;
  answers: Record<string, { choiceIndex: number; at: number }>;
  correctIndex?: number;
};

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
  guesses: Array<{ playerId: string; value: number; at: number }>;
  winnerId?: string;
  winnerReason?: "exact" | "nearest";
  winningGuess?: number;
};

// ---------- Race-style rounds (math / scramble / emoji) ----------
// One prompt. Players submit a typed answer; first correct wins.
export type RaceKind = "math" | "scramble" | "emoji";

export type RaceRound = {
  kind: RaceKind;
  roundNumber: number;
  // What the client sees
  prompt: string;
  subtitle?: string; // e.g. "5 letters"
  // Server-only correct answer + alternates (all lowercased already).
  answers: string[];
  // Players that already submitted wrong answers (cannot retry).
  // Stores first submission per player to prevent spam.
  submissions: Record<string, { text: string; correct: boolean; at: number }>;
  startedAt: number;
  endsAt: number;
  durationMs: number;
  winnerId?: string;
  winningText?: string;
  // Revealed to clients on round end
  revealAnswer?: string;
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
    }
  | {
      kind: RaceKind;
      roundNumber: number;
      prompt: string;
      revealAnswer: string;
      winnerId?: string;
      winnerName?: string;
      winningText?: string;
      submissions: Array<{ playerId: string; name: string; text: string; correct: boolean }>;
    };

export type PublicRoomState = {
  roomId: string;
  hostId: string;
  mode: GameMode;
  status: RoomStatus;
  roundNumber: number;
  totalRounds: number;
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
      }
    | {
        kind: RaceKind;
        roundNumber: number;
        prompt: string;
        subtitle?: string;
        startedAt: number;
        endsAt: number;
        durationMs: number;
        submittedPlayerIds: string[];
        wrongPlayerIds: string[];
        winnerId?: string;
        winningText?: string;
        revealAnswer?: string;
      };
  history: RoundHistoryEntry[];
};
