import { z } from "zod";

// All payloads that cross the network get validated with Zod on the server so
// malformed client messages cannot corrupt in-memory room state.

// Room IDs are normalized to uppercase on the client before sending, but we
// re-normalize server-side too so a raw / lowercase / padded id still works.
export const RoomIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.string().min(4).max(12).regex(/^[A-Z0-9]+$/, "room id must be letters/digits"));

export const PlayerNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^[\w\s.-]+$/u, "letters, numbers, spaces only");

export const RoomCreateSchema = z.object({
  name: PlayerNameSchema,
  mode: z.enum(["quiz", "guess", "math", "scramble", "emoji"]),
});

export const RoomJoinSchema = z.object({
  roomId: RoomIdSchema,
  name: PlayerNameSchema,
});

export const RoomIdOnlySchema = z.object({
  roomId: RoomIdSchema,
});

export const QuizSubmitSchema = z.object({
  roomId: RoomIdSchema,
  choiceIndex: z.number().int().min(0).max(9),
});

export const GuessSubmitSchema = z.object({
  roomId: RoomIdSchema,
  value: z.number().int().min(0).max(1_000_000),
});

export const RaceSubmitSchema = z.object({
  roomId: RoomIdSchema,
  text: z.string().trim().min(1).max(80),
});

export const RejoinSchema = z.object({
  roomId: RoomIdSchema,
  sessionToken: z.string().min(8).max(64),
});
