import type { QuizQuestion } from "@/lib/game/types";

// Seed question bank. Kept server-side only; the correctIndex is never broadcast
// to clients until the round ends.
export const QUESTION_BANK: QuizQuestion[] = [
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
    prompt: "Which of these is NOT a guarantee of reliable broadcast?",
    choices: ["Validity", "Agreement", "Integrity", "Minimum latency"],
    correctIndex: 3,
  },
  {
    id: "q-ds-9",
    prompt: "What does eventual consistency imply?",
    choices: [
      "All reads return the latest write instantly",
      "If writes stop, replicas converge over time",
      "Strong ordering of every read",
      "No replication used",
    ],
    correctIndex: 1,
  },
  {
    id: "q-ds-10",
    prompt: "Which is a typical way to prevent duplicate submissions in a quiz round?",
    choices: [
      "Keep a submitted set keyed by playerId on the server",
      "Trust the client to disable the button",
      "Retry the event three times",
      "Use a shared global variable on the client",
    ],
    correctIndex: 0,
  },
];

export function pickRandomQuestion(excludeIds: Set<string>): QuizQuestion | null {
  const pool = QUESTION_BANK.filter((q) => !excludeIds.has(q.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
