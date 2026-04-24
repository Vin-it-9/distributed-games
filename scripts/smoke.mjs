// Smoke test: exercises every game mode (quiz, guess, math, scramble, emoji).
// - Creates rooms, joins with second client, verifies lobby -> round transitions.
// - Exercises duplicate-answer rejection on quiz.
// - For race modes, verifies server returns {correct: boolean} in ack.
// - Also tests the room-join bug fix: a lowercase code must match its uppercase room.
import { io } from "socket.io-client";

const URL = "http://localhost:3000";
const opts = { path: "/api/socket", transports: ["websocket"] };

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
function emit(sock, ev, payload) {
  return new Promise((resolve, reject) => {
    sock.emit(ev, payload, (res) => {
      if (!res) return resolve({ ok: true });
      res.ok ? resolve(res) : reject(new Error(res.error));
    });
  });
}

function connect() {
  const s = io(URL, opts);
  return new Promise((r) => s.on("connect", () => r(s)));
}

// --- Shared helpers --------------------------------------------------------

async function pair(mode, hostName, guestName) {
  const host = await connect();
  const guest = await connect();
  const created = await emit(host, "room:create", { name: hostName, mode });
  const roomId = created.data.roomId;

  // Try joining with lowercase (normalize test).
  await emit(guest, "room:join", { roomId: roomId.toLowerCase(), name: guestName });

  const states = { host: null, guest: null };
  host.on("room:state", (s) => (states.host = s));
  guest.on("room:state", (s) => (states.guest = s));
  return { host, guest, roomId, states };
}

function currentRound(state) {
  return state?.currentRound;
}

// --- Tests -----------------------------------------------------------------

async function testQuiz() {
  const { host, guest, roomId, states } = await pair("quiz", "QuizHost", "QuizGuest");
  await emit(host, "game:start", { roomId });
  await wait(300);
  if (states.host?.status !== "in-round") throw new Error("quiz not in-round");

  await emit(host, "quiz:submit-answer", { roomId, choiceIndex: 0 });
  await emit(guest, "quiz:submit-answer", { roomId, choiceIndex: 1 });

  let dup = false;
  try {
    await emit(host, "quiz:submit-answer", { roomId, choiceIndex: 2 });
  } catch { dup = true; }
  if (!dup) throw new Error("quiz duplicate not rejected");

  host.close(); guest.close();
  console.log("  quiz: ok");
}

async function testGuess() {
  const { host, guest, roomId } = await pair("guess", "GuessHost", "GuessGuest");
  await emit(host, "game:start", { roomId });
  await wait(300);
  await Promise.all([
    emit(host, "guess:submit", { roomId, value: 50 }),
    emit(guest, "guess:submit", { roomId, value: 51 }),
  ]);
  host.close(); guest.close();
  console.log("  guess: ok");
}

async function testRaceMode(mode) {
  const { host, guest, roomId, states } = await pair(mode, `${mode}H`, `${mode}G`);
  await emit(host, "game:start", { roomId });
  await wait(300);
  const round = currentRound(states.host);
  if (!round) throw new Error(`${mode}: no round`);
  if (round.kind !== mode) throw new Error(`${mode}: wrong round kind ${round.kind}`);

  // Send an obviously-wrong guess; server should still ack with correct=false.
  const ack = await emit(host, "race:submit-answer", { roomId, text: "zzzz_wrong_zzzz" });
  if (typeof ack?.data?.correct !== "boolean") {
    throw new Error(`${mode}: missing correct flag in ack`);
  }
  if (ack.data.correct !== false) throw new Error(`${mode}: wrong guess marked correct`);

  // Duplicate submit for same player should be rejected.
  let dup = false;
  try {
    await emit(host, "race:submit-answer", { roomId, text: "zzzz2" });
  } catch { dup = true; }
  if (!dup) throw new Error(`${mode}: duplicate submit not rejected`);

  // Guest can still submit.
  await emit(guest, "race:submit-answer", { roomId, text: "zzzz_wrong_zzzz" });

  host.close(); guest.close();
  console.log(`  ${mode}: ok (round.kind=${round.kind})`);
}

async function testBadJoin() {
  const g = await connect();
  let rejected = false;
  try {
    await emit(g, "room:join", { roomId: "NOPE99", name: "Ghost" });
  } catch (e) {
    rejected = true;
    if (!/no room/i.test(e.message)) throw new Error("unexpected error: " + e.message);
  }
  if (!rejected) throw new Error("bad room id should have been rejected");
  g.close();
  console.log("  bad-join rejected: ok");
}

// --- Run -------------------------------------------------------------------

try {
  await testQuiz();
  await testGuess();
  await testRaceMode("math");
  await testRaceMode("scramble");
  await testRaceMode("emoji");
  await testBadJoin();
  console.log("SMOKE OK");
  process.exit(0);
} catch (err) {
  console.error("SMOKE FAIL:", err?.stack ?? err);
  process.exit(1);
}
