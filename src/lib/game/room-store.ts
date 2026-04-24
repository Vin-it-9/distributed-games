import type {
  GameMode,
  LeaderboardEntry,
  Player,
  PublicRoomState,
  RoomStatus,
  RoundHistoryEntry,
  QuizRound,
  GuessRound,
  RaceRound,
} from "./types";

export type RoomState = {
  roomId: string;
  hostId: string;
  mode: GameMode;
  players: Map<string, Player>;
  status: RoomStatus;
  roundNumber: number;
  currentRound?: QuizRound | GuessRound | RaceRound;
  usedQuestionIds: Set<string>;
  history: RoundHistoryEntry[];
  sessions: Map<string, string>;
  createdAt: number;
};

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

export function buildLeaderboard(room: RoomState): LeaderboardEntry[] {
  return Array.from(room.players.values())
    .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
    .map((p) => ({ playerId: p.id, name: p.name, score: p.score }));
}

// Total rounds for the mode — surfaced to clients so the progress indicator works.
export function totalRoundsFor(mode: GameMode): number {
  switch (mode) {
    case "quiz": return 5;
    case "guess": return 3;
    case "math":
    case "scramble":
    case "emoji":
      return 5;
  }
}

export function publicRoomState(room: RoomState): PublicRoomState {
  const leaderboard = buildLeaderboard(room);
  const players = Array.from(room.players.values());
  const reveal = room.status === "round-ended" || room.status === "finished";

  let currentRound: PublicRoomState["currentRound"] | undefined;
  const r = room.currentRound;
  if (r?.kind === "quiz") {
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
  } else if (r?.kind === "guess") {
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
  } else if (r && (r.kind === "math" || r.kind === "scramble" || r.kind === "emoji")) {
    const wrongPlayerIds = Object.entries(r.submissions)
      .filter(([, s]) => !s.correct)
      .map(([pid]) => pid);
    currentRound = {
      kind: r.kind,
      roundNumber: r.roundNumber,
      prompt: r.prompt,
      subtitle: r.subtitle,
      startedAt: r.startedAt,
      endsAt: r.endsAt,
      durationMs: r.durationMs,
      submittedPlayerIds: Object.keys(r.submissions),
      wrongPlayerIds,
      winnerId: r.winnerId,
      winningText: r.winningText,
      revealAnswer: reveal ? r.revealAnswer : undefined,
    };
  }

  return {
    roomId: room.roomId,
    hostId: room.hostId,
    mode: room.mode,
    status: room.status,
    roundNumber: room.roundNumber,
    totalRounds: totalRoundsFor(room.mode),
    players,
    leaderboard,
    currentRound,
    history: room.history,
  };
}
