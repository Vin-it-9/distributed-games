// Emoji decode puzzles. The main answer plus optional aliases all match.
// Kept family-friendly. Inspired by common emoji-movie quiz formats.
export type EmojiPuzzle = {
  id: string;
  prompt: string;          // the emoji string
  answer: string;          // canonical answer
  aliases?: string[];      // alternate accepted answers
  hint: string;            // shown as subtitle, e.g. "movie · 7 letters"
};

export const EMOJI_BANK: EmojiPuzzle[] = [
  { id: "e-1", prompt: "🚢💔🧊", answer: "Titanic", hint: "movie · 7 letters" },
  { id: "e-2", prompt: "🦁👑", answer: "The Lion King", aliases: ["lion king"], hint: "animated movie" },
  { id: "e-3", prompt: "🕷️👦🌃", answer: "Spider-Man", aliases: ["spiderman", "spider man"], hint: "superhero movie" },
  { id: "e-4", prompt: "🧑🏻👩🏻🚀🌌", answer: "Interstellar", hint: "space movie · 12 letters" },
  { id: "e-5", prompt: "👻🚫", answer: "Ghostbusters", hint: "classic comedy" },
  { id: "e-6", prompt: "🏝️🏐", answer: "Cast Away", aliases: ["castaway"], hint: "survival movie" },
  { id: "e-7", prompt: "🚀🌌🤖👨‍🚀", answer: "2001 A Space Odyssey",
    aliases: ["2001", "2001: a space odyssey", "a space odyssey", "space odyssey"], hint: "Kubrick classic" },
  { id: "e-8", prompt: "🦈🌊🏊‍♂️", answer: "Jaws", hint: "Spielberg thriller · 4 letters" },
  { id: "e-9", prompt: "🐠🔍", answer: "Finding Nemo", hint: "Pixar movie" },
  { id: "e-10", prompt: "🐼🥋", answer: "Kung Fu Panda", hint: "DreamWorks movie" },
  { id: "e-11", prompt: "🐁👨‍🍳🇫🇷", answer: "Ratatouille", hint: "Pixar · Paris" },
  { id: "e-12", prompt: "🦖🏝️🚗", answer: "Jurassic Park", hint: "dinosaur movie" },
  { id: "e-13", prompt: "🕶️🔫👔", answer: "Men in Black", hint: "alien comedy" },
  { id: "e-14", prompt: "🧔🏻⚔️🐉💍", answer: "The Lord of the Rings",
    aliases: ["lord of the rings", "lotr"], hint: "fantasy trilogy" },
  { id: "e-15", prompt: "🚗⏰👴👦", answer: "Back to the Future",
    aliases: ["back to future"], hint: "sci-fi classic" },
  { id: "e-16", prompt: "🦇🌆🃏", answer: "The Dark Knight",
    aliases: ["dark knight"], hint: "Nolan Batman movie" },
  { id: "e-17", prompt: "🧑‍🚀🔴🪐", answer: "The Martian", aliases: ["martian"], hint: "Mars survival" },
  { id: "e-18", prompt: "🏜️🚗🔥", answer: "Mad Max Fury Road",
    aliases: ["mad max", "mad max: fury road", "fury road"], hint: "action movie" },
  { id: "e-19", prompt: "🌌🚀👽🔫", answer: "Guardians of the Galaxy",
    aliases: ["guardians galaxy", "guardians of galaxy"], hint: "Marvel space movie" },
  { id: "e-20", prompt: "🧙‍♂️👦🐍📚", answer: "Harry Potter and the Chamber of Secrets",
    aliases: ["harry potter chamber of secrets", "chamber of secrets", "harry potter"], hint: "Potter sequel" },
  { id: "e-21", prompt: "🚂❄️🎅🔔", answer: "The Polar Express",
    aliases: ["polar express"], hint: "holiday movie" },
  { id: "e-22", prompt: "🦾🔨⚡", answer: "The Avengers",
    aliases: ["avengers"], hint: "Marvel team-up" },
  { id: "e-23", prompt: "🐯🥊", answer: "Rocky", hint: "boxing classic · 5 letters" },
  { id: "e-24", prompt: "🚢🌊❤️", answer: "Titanic", hint: "sea romance · 7 letters" },
  { id: "e-25", prompt: "⚡🧙‍♂️⚔️", answer: "Harry Potter", hint: "wizard series" },
];

export function pickRandomEmoji(exclude: Set<string>): EmojiPuzzle | null {
  const pool = EMOJI_BANK.filter((p) => !exclude.has(p.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Normalize a user answer for fuzzy comparison: lowercase, strip punctuation,
// collapse whitespace, remove leading "the".
export function normalizeAnswer(raw: string): string {
  let s = raw.toLowerCase().trim();
  s = s.replace(/[^\p{L}\p{N}\s]/gu, "");
  s = s.replace(/\s+/g, " ");
  s = s.replace(/^the\s+/, "");
  return s;
}
