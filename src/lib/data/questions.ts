import type { QuizQuestion } from "@/lib/game/types";

// Expanded, verified question bank spanning general knowledge, science,
// geography, pop culture, and a few distributed-systems classics. Kept
// server-side only; correctIndex is never broadcast during a live round.
export const QUESTION_BANK: QuizQuestion[] = [
  // ----- Distributed systems (original core) -----
  {
    id: "q-ds-1",
    prompt: "Which component in distributed systems broadcasts a message to all subscribers in a group?",
    choices: ["Load balancer", "Publisher in pub/sub", "Proxy", "Message queue consumer"],
    correctIndex: 1,
  },
  {
    id: "q-ds-2",
    prompt: "What problem do Lamport timestamps primarily help solve?",
    choices: ["Load balancing", "Event ordering", "Authentication", "Data compression"],
    correctIndex: 1,
  },
  {
    id: "q-ds-3",
    prompt: "In CAP theorem, which pair cannot be fully guaranteed together when a network partition occurs?",
    choices: ["C and A", "C and P", "A and P", "All three"],
    correctIndex: 0,
  },
  {
    id: "q-ds-4",
    prompt: "Which of these is a classic race condition mitigation?",
    choices: ["Busy looping", "Atomic compare-and-swap", "Longer timeouts", "More threads"],
    correctIndex: 1,
  },
  {
    id: "q-ds-5",
    prompt: "Socket.IO adds what primary feature on top of plain WebSockets?",
    choices: [
      "Built-in encryption",
      "Rooms, acknowledgements and auto-reconnect",
      "Database persistence",
      "CPU isolation",
    ],
    correctIndex: 1,
  },
  {
    id: "q-ds-6",
    prompt: "Which consensus algorithm is designed to be easier to understand than Paxos?",
    choices: ["Raft", "2PC", "Gossip", "Chord"],
    correctIndex: 0,
  },
  {
    id: "q-ds-7",
    prompt: "Which pattern resolves simultaneous writes by picking the server arrival order?",
    choices: ["Last-writer-wins by server timestamp", "Client-side optimistic lock", "Random choice", "Reject all"],
    correctIndex: 0,
  },
  {
    id: "q-ds-8",
    prompt: "What does eventual consistency imply?",
    choices: [
      "All reads return the latest write instantly",
      "If writes stop, replicas converge over time",
      "Strong ordering of every read",
      "No replication used",
    ],
    correctIndex: 1,
  },

  // ----- General knowledge / geography -----
  { id: "q-gk-1", prompt: "Which planet is known as the Red Planet?",
    choices: ["Venus", "Mars", "Jupiter", "Mercury"], correctIndex: 1 },
  { id: "q-gk-2", prompt: "What is the capital of Australia?",
    choices: ["Sydney", "Melbourne", "Canberra", "Perth"], correctIndex: 2 },
  { id: "q-gk-3", prompt: "The Great Wall of China is visible from which of these?",
    choices: ["Moon", "Space station (low orbit, at best)", "Mars rover", "Voyager 1"], correctIndex: 1 },
  { id: "q-gk-4", prompt: "Which country gifted the Statue of Liberty to the United States?",
    choices: ["Spain", "France", "Italy", "United Kingdom"], correctIndex: 1 },
  { id: "q-gk-5", prompt: "Which ocean is the largest by area?",
    choices: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3 },
  { id: "q-gk-6", prompt: "Mount Everest lies on the border of Nepal and which other country?",
    choices: ["India", "Bhutan", "China (Tibet)", "Pakistan"], correctIndex: 2 },
  { id: "q-gk-7", prompt: "Which city is known as the Eternal City?",
    choices: ["Athens", "Rome", "Jerusalem", "Istanbul"], correctIndex: 1 },
  { id: "q-gk-8", prompt: "The currency Yen belongs to which country?",
    choices: ["China", "South Korea", "Japan", "Thailand"], correctIndex: 2 },

  // ----- Science / tech -----
  { id: "q-sc-1", prompt: "Water boils at what temperature at sea level?",
    choices: ["90°C", "100°C", "110°C", "120°C"], correctIndex: 1 },
  { id: "q-sc-2", prompt: "How many bones are in the adult human body?",
    choices: ["186", "206", "226", "246"], correctIndex: 1 },
  { id: "q-sc-3", prompt: "What does CPU stand for?",
    choices: ["Central Processing Unit", "Computer Power Unit", "Central Program Utility", "Core Processing Utility"], correctIndex: 0 },
  { id: "q-sc-4", prompt: "Which language is primarily used for styling web pages?",
    choices: ["HTML", "CSS", "JavaScript", "SQL"], correctIndex: 1 },
  { id: "q-sc-5", prompt: "Who is considered the founder of the World Wide Web?",
    choices: ["Bill Gates", "Tim Berners-Lee", "Steve Jobs", "Linus Torvalds"], correctIndex: 1 },
  { id: "q-sc-6", prompt: "What is the chemical symbol for gold?",
    choices: ["Gd", "Go", "Au", "Ag"], correctIndex: 2 },
  { id: "q-sc-7", prompt: "Which gas do plants absorb from the atmosphere during photosynthesis?",
    choices: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correctIndex: 2 },
  { id: "q-sc-8", prompt: "The speed of light is approximately…",
    choices: ["300,000 km/s", "30,000 km/s", "3,000,000 km/s", "30,000 km/h"], correctIndex: 0 },

  // ----- Pop culture / sports / history -----
  { id: "q-pc-1", prompt: "Who painted the Mona Lisa?",
    choices: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], correctIndex: 2 },
  { id: "q-pc-2", prompt: "Which country hosted the 2016 Summer Olympics?",
    choices: ["China", "Brazil", "UK", "Japan"], correctIndex: 1 },
  { id: "q-pc-3", prompt: "In which year did humans first land on the Moon?",
    choices: ["1965", "1969", "1972", "1959"], correctIndex: 1 },
  { id: "q-pc-4", prompt: "Which company created the iPhone?",
    choices: ["Microsoft", "Samsung", "Apple", "Nokia"], correctIndex: 2 },
  { id: "q-pc-5", prompt: "Which is the longest river in the world?",
    choices: ["Amazon", "Nile", "Yangtze", "Mississippi"], correctIndex: 1 },
  { id: "q-pc-6", prompt: "Cricket's highest governing body is abbreviated as…",
    choices: ["FIFA", "ICC", "IOC", "BCCI"], correctIndex: 1 },
  { id: "q-pc-7", prompt: "In which Indian state is Pune located?",
    choices: ["Karnataka", "Maharashtra", "Gujarat", "Goa"], correctIndex: 1 },
  { id: "q-pc-8", prompt: "Who wrote the play “Romeo and Juliet”?",
    choices: ["Charles Dickens", "Mark Twain", "William Shakespeare", "Jane Austen"], correctIndex: 2 },
  { id: "q-pc-9", prompt: "The programming language Java was originally developed at…",
    choices: ["Microsoft", "Oracle", "Sun Microsystems", "IBM"], correctIndex: 2 },
  { id: "q-pc-10", prompt: "Which tag is used to create a hyperlink in HTML?",
    choices: ["<link>", "<a>", "<href>", "<url>"], correctIndex: 1 },
];

export function pickRandomQuestion(excludeIds: Set<string>): QuizQuestion | null {
  const pool = QUESTION_BANK.filter((q) => !excludeIds.has(q.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
