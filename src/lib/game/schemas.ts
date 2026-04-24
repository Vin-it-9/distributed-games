import { z } from "zod";

// All payloads that cross the network get validated with Zod on the server so
// malformed client messages cannot corrupt in-memory room state.

export const RoomIdSchema = z
  .string()
  .min(4)
  .max(32)
  .regex(/^[A-Za-z0-9_-]+$/);

export const PlayerNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^[\w\s.-]+$/u, "letters, numbers, spaces only");

export const RoomCreateSchema = z.object({
  name: PlayerNameSchema,
  mode: z.enum(["quiz", "guess"]),
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

export const RejoinSchema = z.object({
  roomId: RoomIdSchema,
  sessionToken: z.string().min(8).max(64),
});
