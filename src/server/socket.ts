import type { Server as HTTPServer } from "http";
import { Server as IOServer, type Socket } from "socket.io";
import { ZodError, type ZodTypeAny, type z as ZType } from "zod";
import { newPlayerId, newRoomId, newSessionToken } from "@/lib/game/ids";

import { CLIENT_EVENTS, SERVER_EVENTS } from "@/lib/socket/events";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/socket/events";
import {
  GuessSubmitSchema,
  QuizSubmitSchema,
  RaceSubmitSchema,
  RejoinSchema,
  RoomCreateSchema,
  RoomIdOnlySchema,
  RoomJoinSchema,
} from "@/lib/game/schemas";
import {
  areAllModesUnlocked,
  getAvailableModes,
  isModeAvailable,
  lockToDefaultModes,
  unlockAllModes,
} from "@/lib/game/mode-gate";
import {
  buildLeaderboard,
  createRoom,
  getRoom,
  publicRoomState,
  type RoomState,
} from "@/lib/game/room-store";
import {
  finalizeQuizRound,
  isQuizGameFinished,
  startQuizRound,
  submitQuizAnswer,
} from "@/lib/game/quiz-engine";
import {
  finalizeGuessRound,
  isGuessGameFinished,
  startGuessRound,
  submitGuess,
} from "@/lib/game/guess-engine";
import {
  finalizeRaceRound,
  isRaceGameFinished,
  startRaceRound,
  submitRaceAnswer,
} from "@/lib/game/race-engine";
import { cancelRoomTimer, startRoomTimer } from "@/lib/game/timers";

type SocketData = {
  playerId?: string;
  roomId?: string;
  sessionToken?: string;
};

type IO = IOServer<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type SocketT = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

// Helpers --------------------------------------------------------------

function parse<T extends ZodTypeAny>(schema: T, data: unknown): ZType.infer<T> | { __error: string } {
  try {
    return schema.parse(data) as ZType.infer<T>;
  } catch (err) {
    if (err instanceof ZodError) {
      return { __error: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
    }
    return { __error: "invalid payload" };
  }
}

function emitRoomState(io: IO, room: RoomState) {
  io.to(room.roomId).emit(SERVER_EVENTS.ROOM_STATE, publicRoomState(room));
}

function emitLeaderboard(io: IO, room: RoomState) {
  io.to(room.roomId).emit(SERVER_EVENTS.LEADERBOARD_UPDATE, buildLeaderboard(room));
}

function broadcastError(socket: SocketT, code: string, message: string) {
  socket.emit(SERVER_EVENTS.ERROR, { code, message });
}

// Round lifecycle ------------------------------------------------------

function scheduleRoundEnd(io: IO, room: RoomState, durationMs: number) {
  startRoomTimer(room.roomId, durationMs, {
    onTick: (endsAt, now) => {
      io.to(room.roomId).emit(SERVER_EVENTS.TIMER_UPDATE, {
        roomId: room.roomId,
        endsAt,
        now,
      });
    },
    onEnd: () => endCurrentRound(io, room),
  });
}

function endCurrentRound(io: IO, room: RoomState) {
  cancelRoomTimer(room.roomId);
  if (!room.currentRound) return;
  let finished = false;
  if (room.currentRound.kind === "quiz") {
    finalizeQuizRound(room);
    finished = isQuizGameFinished(room);
  } else if (room.currentRound.kind === "guess") {
    finalizeGuessRound(room);
    finished = isGuessGameFinished(room);
  } else {
    finalizeRaceRound(room);
    finished = isRaceGameFinished(room);
  }
  if (finished) room.status = "finished";
  emitRoomState(io, room);
  emitLeaderboard(io, room);
  io.to(room.roomId).emit(SERVER_EVENTS.ROUND_ENDED, publicRoomState(room));
  if (finished) io.to(room.roomId).emit(SERVER_EVENTS.GAME_FINISHED, publicRoomState(room));
}

function beginNextRound(io: IO, room: RoomState) {
  cancelRoomTimer(room.roomId);
  let durationMs: number | null = null;
  if (room.mode === "quiz") {
    const round = startQuizRound(room);
    if (!round) {
      room.status = "finished";
      emitRoomState(io, room);
      io.to(room.roomId).emit(SERVER_EVENTS.GAME_FINISHED, publicRoomState(room));
      return;
    }
    durationMs = round.durationMs;
  } else if (room.mode === "guess") {
    const round = startGuessRound(room);
    durationMs = round.durationMs;
  } else {
    const round = startRaceRound(room, room.mode);
    if (!round) {
      room.status = "finished";
      emitRoomState(io, room);
      io.to(room.roomId).emit(SERVER_EVENTS.GAME_FINISHED, publicRoomState(room));
      return;
    }
    durationMs = round.durationMs;
  }
  scheduleRoundEnd(io, room, durationMs);
  emitRoomState(io, room);
  io.to(room.roomId).emit(SERVER_EVENTS.ROUND_STARTED, publicRoomState(room));
}

// Registration --------------------------------------------------------

export function registerSocketHandlers(server: HTTPServer): IO {
  const io: IO = new IOServer(server, {
    path: "/api/socket",
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    socket.on(CLIENT_EVENTS.MODES_GET, (_payload, ack) => {
      ack?.({
        ok: true,
        data: { modes: getAvailableModes(), unlocked: areAllModesUnlocked() },
      });
    });

    socket.on(CLIENT_EVENTS.MODES_UNLOCK, (_payload, ack) => {
      unlockAllModes();
      ack?.({
        ok: true,
        data: { modes: getAvailableModes(), unlocked: areAllModesUnlocked() },
      });
    });

    socket.on(CLIENT_EVENTS.MODES_LOCK, (_payload, ack) => {
      lockToDefaultModes();
      ack?.({
        ok: true,
        data: { modes: getAvailableModes(), unlocked: areAllModesUnlocked() },
      });
    });

    // ROOM CREATE ------------------------------------------------------
    socket.on(CLIENT_EVENTS.ROOM_CREATE, (payload, ack) => {
      const parsed = parse(RoomCreateSchema, payload);
      if ("__error" in parsed) return ack?.({ ok: false, error: parsed.__error });
      if (!isModeAvailable(parsed.mode)) {
        return ack?.({ ok: false, error: "mode is locked" });
      }

      // Retry up to a few times in the astronomically unlikely event of
      // a collision in the in-memory map.
      let roomId = newRoomId();
      for (let i = 0; i < 5 && getRoom(roomId); i++) roomId = newRoomId();
      const playerId = newPlayerId();
      const sessionToken = newSessionToken();

      const room = createRoom({ roomId, hostId: playerId, mode: parsed.mode });
      room.players.set(playerId, {
        id: playerId,
        name: parsed.name,
        score: 0,
        connected: true,
        joinedAt: Date.now(),
        isHost: true,
      });
      room.sessions.set(sessionToken, playerId);

      socket.data.roomId = roomId;
      socket.data.playerId = playerId;
      socket.data.sessionToken = sessionToken;
      socket.join(roomId);

      socket.emit(SERVER_EVENTS.SESSION_ASSIGNED, { playerId, sessionToken, roomId });
      emitRoomState(io, room);
      ack?.({ ok: true, data: { roomId, playerId, sessionToken } });
    });

    // ROOM JOIN --------------------------------------------------------
    socket.on(CLIENT_EVENTS.ROOM_JOIN, (payload, ack) => {
      const parsed = parse(RoomJoinSchema, payload);
      if ("__error" in parsed) return ack?.({ ok: false, error: parsed.__error });

      const room = getRoom(parsed.roomId);
      if (!room) return ack?.({ ok: false, error: `no room with code ${parsed.roomId}` });
      if (room.status === "finished") return ack?.({ ok: false, error: "game already finished" });
      // Reject duplicate display names in a room — would be confusing.
      for (const p of room.players.values()) {
        if (p.name.toLowerCase() === parsed.name.toLowerCase()) {
          return ack?.({ ok: false, error: "name already taken in this room" });
        }
      }

      const playerId = newPlayerId();
      const sessionToken = newSessionToken();
      room.players.set(playerId, {
        id: playerId,
        name: parsed.name,
        score: 0,
        connected: true,
        joinedAt: Date.now(),
        isHost: false,
      });
      room.sessions.set(sessionToken, playerId);

      socket.data.roomId = parsed.roomId;
      socket.data.playerId = playerId;
      socket.data.sessionToken = sessionToken;
      socket.join(parsed.roomId);

      socket.emit(SERVER_EVENTS.SESSION_ASSIGNED, {
        playerId,
        sessionToken,
        roomId: parsed.roomId,
      });
      io.to(parsed.roomId).emit(SERVER_EVENTS.PLAYER_JOINED, {
        playerId,
        name: parsed.name,
      });
      emitRoomState(io, room);
      ack?.({ ok: true, data: { playerId, sessionToken } });
    });

    // REJOIN (after refresh) ------------------------------------------
    socket.on(CLIENT_EVENTS.REJOIN, (payload, ack) => {
      const parsed = parse(RejoinSchema, payload);
      if ("__error" in parsed) return ack?.({ ok: false, error: parsed.__error });

      const room = getRoom(parsed.roomId);
      if (!room) return ack?.({ ok: false, error: "room not found" });
      const playerId = room.sessions.get(parsed.sessionToken);
      if (!playerId || !room.players.has(playerId)) {
        return ack?.({ ok: false, error: "session invalid" });
      }
      const player = room.players.get(playerId)!;
      player.connected = true;

      socket.data.roomId = parsed.roomId;
      socket.data.playerId = playerId;
      socket.data.sessionToken = parsed.sessionToken;
      socket.join(parsed.roomId);

      emitRoomState(io, room);
      ack({ ok: true, data: { playerId } });
    });

    // GAME START -------------------------------------------------------
    socket.on(CLIENT_EVENTS.GAME_START, (payload, ack) => {
      const parsed = parse(RoomIdOnlySchema, payload);
      if ("__error" in parsed) return ack?.({ ok: false, error: parsed.__error });
      const room = getRoom(parsed.roomId);
      if (!room) return ack?.({ ok: false, error: "room not found" });
      if (socket.data.playerId !== room.hostId) {
        return ack?.({ ok: false, error: "only host can start" });
      }
      if (room.status !== "lobby" && room.status !== "finished") {
        return ack?.({ ok: false, error: "already started" });
      }
      if (room.players.size < 1) return ack?.({ ok: false, error: "no players" });

      // Reset on restart-after-finish.
      if (room.status === "finished") {
        room.roundNumber = 0;
        room.usedQuestionIds.clear();
        room.history = [];
        for (const p of room.players.values()) p.score = 0;
      }

      io.to(room.roomId).emit(SERVER_EVENTS.GAME_STARTED, publicRoomState(room));
      beginNextRound(io, room);
      ack?.({ ok: true });
    });

    // QUIZ ANSWER ------------------------------------------------------
    socket.on(CLIENT_EVENTS.QUIZ_SUBMIT, (payload, ack) => {
      const parsed = parse(QuizSubmitSchema, payload);
      if ("__error" in parsed) return ack?.({ ok: false, error: parsed.__error });
      const room = getRoom(parsed.roomId);
      if (!room) return ack?.({ ok: false, error: "room not found" });
      if (room.mode !== "quiz") return ack?.({ ok: false, error: "wrong mode" });
      const playerId = socket.data.playerId;
      if (!playerId || !room.players.has(playerId)) {
        return ack?.({ ok: false, error: "not in room" });
      }
      const res = submitQuizAnswer(room, playerId, parsed.choiceIndex, Date.now());
      if (!res.accepted) return ack?.({ ok: false, error: res.reason ?? "rejected" });
      emitRoomState(io, room);
      ack?.({ ok: true });
    });

    // RACE SUBMIT (math / scramble / emoji) ----------------------------
    socket.on(CLIENT_EVENTS.RACE_SUBMIT, (payload, ack) => {
      const parsed = parse(RaceSubmitSchema, payload);
      if ("__error" in parsed) return ack?.({ ok: false, error: parsed.__error });
      const room = getRoom(parsed.roomId);
      if (!room) return ack?.({ ok: false, error: "room not found" });
      if (room.mode !== "math" && room.mode !== "scramble" && room.mode !== "emoji") {
        return ack?.({ ok: false, error: "wrong mode" });
      }
      const playerId = socket.data.playerId;
      if (!playerId || !room.players.has(playerId)) {
        return ack?.({ ok: false, error: "not in room" });
      }
      const res = submitRaceAnswer(room, playerId, parsed.text, Date.now());
      if (!res.accepted) return ack?.({ ok: false, error: res.reason ?? "rejected" });
      emitRoomState(io, room);
      if (res.winNow) endCurrentRound(io, room);
      ack?.({ ok: true, data: { correct: res.correct } });
    });

    // GUESS SUBMIT -----------------------------------------------------
    socket.on(CLIENT_EVENTS.GUESS_SUBMIT, (payload, ack) => {
      const parsed = parse(GuessSubmitSchema, payload);
      if ("__error" in parsed) return ack?.({ ok: false, error: parsed.__error });
      const room = getRoom(parsed.roomId);
      if (!room) return ack?.({ ok: false, error: "room not found" });
      if (room.mode !== "guess") return ack?.({ ok: false, error: "wrong mode" });
      const playerId = socket.data.playerId;
      if (!playerId || !room.players.has(playerId)) {
        return ack?.({ ok: false, error: "not in room" });
      }
      const res = submitGuess(room, playerId, parsed.value, Date.now());
      if (!res.accepted) return ack?.({ ok: false, error: res.reason ?? "rejected" });
      emitRoomState(io, room);
      if (res.winNow) endCurrentRound(io, room);
      ack?.({ ok: true });
    });

    // NEXT ROUND -------------------------------------------------------
    socket.on(CLIENT_EVENTS.ROUND_NEXT, (payload, ack) => {
      const parsed = parse(RoomIdOnlySchema, payload);
      if ("__error" in parsed) return ack?.({ ok: false, error: parsed.__error });
      const room = getRoom(parsed.roomId);
      if (!room) return ack?.({ ok: false, error: "room not found" });
      if (socket.data.playerId !== room.hostId) {
        return ack?.({ ok: false, error: "only host" });
      }
      if (room.status !== "round-ended") {
        return ack?.({ ok: false, error: "round not ended" });
      }
      // Stop if all rounds are used
      const doneQuiz = room.mode === "quiz" && isQuizGameFinished(room);
      const doneGuess = room.mode === "guess" && isGuessGameFinished(room);
      const doneRace = isRaceGameFinished(room);
      if (doneQuiz || doneGuess || doneRace) {
        room.status = "finished";
        emitRoomState(io, room);
        io.to(room.roomId).emit(SERVER_EVENTS.GAME_FINISHED, publicRoomState(room));
        return ack?.({ ok: true });
      }
      beginNextRound(io, room);
      ack?.({ ok: true });
    });

    // GAME RESET -------------------------------------------------------
    socket.on(CLIENT_EVENTS.GAME_RESET, (payload, ack) => {
      const parsed = parse(RoomIdOnlySchema, payload);
      if ("__error" in parsed) return ack?.({ ok: false, error: parsed.__error });
      const room = getRoom(parsed.roomId);
      if (!room) return ack?.({ ok: false, error: "room not found" });
      if (socket.data.playerId !== room.hostId) {
        return ack?.({ ok: false, error: "only host" });
      }
      cancelRoomTimer(room.roomId);
      room.roundNumber = 0;
      room.usedQuestionIds.clear();
      room.history = [];
      room.currentRound = undefined;
      room.status = "lobby";
      for (const p of room.players.values()) p.score = 0;
      emitRoomState(io, room);
      emitLeaderboard(io, room);
      ack?.({ ok: true });
    });

    // LEAVE ------------------------------------------------------------
    socket.on(CLIENT_EVENTS.ROOM_LEAVE, (payload, ack) => {
      const parsed = parse(RoomIdOnlySchema, payload);
      if ("__error" in parsed) return ack?.({ ok: false, error: parsed.__error });
      const room = getRoom(parsed.roomId);
      if (!room) return ack?.({ ok: true });
      const playerId = socket.data.playerId;
      if (playerId) {
        const p = room.players.get(playerId);
        if (p) {
          room.players.delete(playerId);
          io.to(room.roomId).emit(SERVER_EVENTS.PLAYER_LEFT, {
            playerId,
            name: p.name,
          });
        }
      }
      socket.leave(room.roomId);
      emitRoomState(io, room);
      ack?.({ ok: true });
    });

    // DISCONNECT -------------------------------------------------------
    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      const playerId = socket.data.playerId;
      if (!roomId || !playerId) return;
      const room = getRoom(roomId);
      if (!room) return;
      const p = room.players.get(playerId);
      if (p) {
        p.connected = false;
        emitRoomState(io, room);
      }
    });

    // Basic error safety net
    socket.on("error", (err) => {
      broadcastError(socket, "socket-error", err?.message ?? "unknown");
    });
  });

  return io;
}
