import { customAlphabet } from "nanoid";

// Room codes are short and hand-typed. Use uppercase alphanumeric, skipping
// visually ambiguous characters (0/O, 1/I, L, 5/S). Six chars give ~1.5B combos
// which is plenty for an in-memory demo, and is easy to say out loud.
const ROOM_ALPHABET = "ABCDEFGHJKMNPQRTUVWXYZ23456789";
export const newRoomId = customAlphabet(ROOM_ALPHABET, 6);

// Session + player IDs never leave the server's event payloads, so the default
// nanoid alphabet is fine.
import { nanoid } from "nanoid";
export const newPlayerId = () => nanoid(12);
export const newSessionToken = () => nanoid(24);

// Normalize whatever the user typed in the join box into a canonical room id.
// Strips whitespace, uppercases, and drops characters outside the alphabet.
export function normalizeRoomId(input: string): string {
  if (!input) return "";
  const up = input.trim().toUpperCase();
  let out = "";
  for (const ch of up) {
    if (ROOM_ALPHABET.includes(ch)) out += ch;
  }
  return out;
}

export function isValidRoomId(id: string): boolean {
  if (id.length < 4 || id.length > 12) return false;
  for (const ch of id) if (!ROOM_ALPHABET.includes(ch)) return false;
  return true;
}
