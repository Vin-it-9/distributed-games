// Event names used on both client and server. Keep them centralized so both
// sides can't drift. Payloads are validated with Zod on the server.

import type { PublicRoomState, LeaderboardEntry, GameMode } from "@/lib/game/types";

export const SERVER_EVENTS = {
  ROOM_STATE: "room:state",
  PLAYER_JOINED: "player:joined",
  PLAYER_LEFT: "player:left",
  GAME_STARTED: "game:started",
  ROUND_STARTED: "round:started",
  TIMER_UPDATE: "timer:update",
  ROUND_ENDED: "round:ended",
  LEADERBOARD_UPDATE: "leaderboard:update",
  GAME_FINISHED: "game:finished",
  SESSION_ASSIGNED: "session:assigned",
  ERROR: "error:message",
} as const;

export const CLIENT_EVENTS = {
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  PLAYER_READY: "player:ready",
  GAME_START: "game:start",
  QUIZ_SUBMIT: "quiz:submit-answer",
  GUESS_SUBMIT: "guess:submit",
  RACE_SUBMIT: "race:submit-answer",
  ROUND_NEXT: "round:next",
  GAME_RESET: "game:reset",
  REJOIN: "session:rejoin",
} as const;

export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];
export type ClientEvent = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];

export type TimerTick = { roomId: string; endsAt: number; now: number };

export type ServerToClientEvents = {
  [SERVER_EVENTS.ROOM_STATE]: (state: PublicRoomState) => void;
  [SERVER_EVENTS.PLAYER_JOINED]: (p: { playerId: string; name: string }) => void;
  [SERVER_EVENTS.PLAYER_LEFT]: (p: { playerId: string; name: string }) => void;
  [SERVER_EVENTS.GAME_STARTED]: (state: PublicRoomState) => void;
  [SERVER_EVENTS.ROUND_STARTED]: (state: PublicRoomState) => void;
  [SERVER_EVENTS.TIMER_UPDATE]: (tick: TimerTick) => void;
  [SERVER_EVENTS.ROUND_ENDED]: (state: PublicRoomState) => void;
  [SERVER_EVENTS.LEADERBOARD_UPDATE]: (lb: LeaderboardEntry[]) => void;
  [SERVER_EVENTS.GAME_FINISHED]: (state: PublicRoomState) => void;
  [SERVER_EVENTS.SESSION_ASSIGNED]: (p: {
    playerId: string;
    sessionToken: string;
    roomId: string;
  }) => void;
  [SERVER_EVENTS.ERROR]: (p: { code: string; message: string }) => void;
};

export type Ack<T = unknown> = (
  res: { ok: true; data?: T } | { ok: false; error: string }
) => void;

export type ClientToServerEvents = {
  [CLIENT_EVENTS.ROOM_CREATE]: (
    p: { name: string; mode: GameMode },
    ack: Ack<{ roomId: string; playerId: string; sessionToken: string }>
  ) => void;
  [CLIENT_EVENTS.ROOM_JOIN]: (
    p: { roomId: string; name: string },
    ack: Ack<{ playerId: string; sessionToken: string }>
  ) => void;
  [CLIENT_EVENTS.ROOM_LEAVE]: (p: { roomId: string }, ack?: Ack) => void;
  [CLIENT_EVENTS.PLAYER_READY]: (p: { roomId: string }, ack?: Ack) => void;
  [CLIENT_EVENTS.GAME_START]: (p: { roomId: string }, ack?: Ack) => void;
  [CLIENT_EVENTS.QUIZ_SUBMIT]: (
    p: { roomId: string; choiceIndex: number },
    ack?: Ack
  ) => void;
  [CLIENT_EVENTS.GUESS_SUBMIT]: (
    p: { roomId: string; value: number },
    ack?: Ack
  ) => void;
  [CLIENT_EVENTS.RACE_SUBMIT]: (
    p: { roomId: string; text: string },
    ack?: Ack<{ correct: boolean }>
  ) => void;
  [CLIENT_EVENTS.ROUND_NEXT]: (p: { roomId: string }, ack?: Ack) => void;
  [CLIENT_EVENTS.GAME_RESET]: (p: { roomId: string }, ack?: Ack) => void;
  [CLIENT_EVENTS.REJOIN]: (
    p: { roomId: string; sessionToken: string },
    ack: Ack<{ playerId: string }>
  ) => void;
};
