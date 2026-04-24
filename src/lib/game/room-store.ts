import type {
  GameMode,
  LeaderboardEntry,
  Player,
  PublicRoomState,
  RoomStatus,
  RoundHistoryEntry,
  QuizRound,
  GuessRound,
} from "./types";

// Full server-side room state. `players` uses a Map for O(1) updates; we
// convert to an array only when broadcasting.
export type RoomState = {
  roomId: string;
  hostId: string;
  mode: GameMode;
  players: Map<string, Player>;
  status: RoomStatus;
  roundNumber: number;
  currentRound?: QuizRound | GuessRound;
  usedQuestionIds: Set<string>;
  history: RoundHistoryEntry[];
  // sessionToken -> playerId, used for rejoin after refresh
  sessions: Map<string, string>;
  createdAt: number;
};

// Module-scoped map persists for the life of the Node process. Resets on restart.
const rooms = new Map<string, RoomState>();

export function createRoom(params: {
  roomId: string;
  hostId: string;
  mode: GameMode;
}): RoomState {
  const room: RoomState = {
    roomId: params.roomId,
    hostId: params.hostId,
    mode: params.mode,
    players: new Map(),
    status: "lobby",
    roundNumber: 0,
    usedQuestionIds: new Set(),
    history: [],
    sessions: new Map(),
    createdAt: Date.now(),
  };
  rooms.set(params.roomId, room);
  return room;
}

export function getRoom(roomId: string): RoomState | undefined {
  return rooms.get(roomId);
}

export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}

export function getAllRoomIds(): string[] {
  return Array.from(rooms.keys());
}

export function buildLeaderboard(room: RoomState): LeaderboardEntry[] {
  return Array.from(room.players.values())
    .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
    .map((p) => ({ playerId: p.id, name: p.name, score: p.score }));
}

// Strips server-only fields (correct answer, target number) when the round is
// still live. Returns JSON-safe shape (no Maps).
export function publicRoomState(room: RoomState): PublicRoomState {
  const leaderboard = buildLeaderboard(room);
  const players = Array.from(room.players.values());

  let currentRound: PublicRoomState["currentRound"] | undefined;
  if (room.currentRound?.kind === "quiz") {
    const r = room.currentRound;
    const reveal = room.status === "round-ended" || room.status === "finished";
    currentRound = {
      kind: "quiz",
      roundNumber: r.roundNumber,
      question: {
        id: r.question.id,
        prompt: r.question.prompt,
        choices: r.question.choices,
      },
      startedAt: r.startedAt,
      endsAt: r.endsAt,
      durationMs: r.durationMs,
      answeredPlayerIds: Object.keys(r.answers),
      correctIndex: reveal ? r.correctIndex ?? r.question.correctIndex : undefined,
    };
  } else if (room.currentRound?.kind === "guess") {
    const r = room.currentRound;
    const reveal = room.status === "round-ended" || room.status === "finished";
    currentRound = {
      kind: "guess",
      roundNumber: r.roundNumber,
      min: r.min,
      max: r.max,
      startedAt: r.startedAt,
      endsAt: r.endsAt,
      durationMs: r.durationMs,
      guessCount: r.guesses.length,
      target: reveal ? r.target : undefined,
      winnerId: r.winnerId,
      winnerReason: r.winnerReason,
      winningGuess: r.winningGuess,
    };
  }

  return {
    roomId: room.roomId,
    hostId: room.hostId,
    mode: room.mode,
    status: room.status,
    roundNumber: room.roundNumber,
    players,
    leaderboard,
    currentRound,
    history: room.history,
  };
}
