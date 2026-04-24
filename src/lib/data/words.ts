// Word bank for the Scramble game. Common, family-friendly 5–8 letter words.
// Server picks one, scrambles it, and broadcasts the scramble to clients.
export const WORD_BANK: string[] = [
  "planet", "jungle", "rocket", "python", "guitar", "island",
  "forest", "castle", "monkey", "puzzle", "gravel", "silver",
  "coffee", "pepper", "orange", "window", "galaxy", "mirror",
  "pencil", "bridge", "basket", "marker", "laptop", "canvas",
  "pirate", "magnet", "bottle", "stream", "gadget", "circle",
  "rabbit", "tunnel", "volume", "cactus", "dolphin", "meteor",
  "thunder", "whisper", "diamond", "pancake", "compass", "harvest",
  "kingdom", "mystery", "pyramid", "treasure", "vampire", "victory",
];

// Fisher-Yates scramble that guarantees the result differs from the source.
export function scrambleWord(word: string): string {
  if (word.length <= 1) return word;
  const chars = word.split("");
  for (let tries = 0; tries < 8; tries++) {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const out = chars.join("");
    if (out !== word) return out;
  }
  // Fallback: rotate by one.
  return word.slice(1) + word[0];
}

export function pickRandomWord(exclude: Set<string>): string | null {
  const pool = WORD_BANK.filter((w) => !exclude.has(w));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
