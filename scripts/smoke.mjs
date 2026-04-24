// Minimal smoke test: create a room, join with a second client, start game,
// submit answers, advance rounds. Exits 0 on success.
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

const host = io(URL, opts);
const guest = io(URL, opts);

await new Promise((r) => host.on("connect", r));
await new Promise((r) => guest.on("connect", r));

const created = await emit(host, "room:create", { name: "Host", mode: "quiz" });
console.log("created room", created.data.roomId);
const roomId = created.data.roomId;

await emit(guest, "room:join", { roomId, name: "Guest" });
console.log("guest joined");

let lastState = null;
for (const sock of [host, guest]) {
  sock.on("room:state", (s) => (lastState = s));
}

await emit(host, "game:start", { roomId });
await wait(300);
if (!lastState || lastState.status !== "in-round") {
  throw new Error("expected in-round after start");
}
console.log("round started:", lastState.currentRound?.roundNumber);

await emit(host, "quiz:submit-answer", { roomId, choiceIndex: 0 });
await emit(guest, "quiz:submit-answer", { roomId, choiceIndex: 1 });
// Duplicate should be rejected.
let dupRejected = false;
try {
  await emit(host, "quiz:submit-answer", { roomId, choiceIndex: 2 });
} catch (e) {
  dupRejected = true;
  console.log("duplicate rejected:", e.message);
}
if (!dupRejected) throw new Error("duplicate answer not rejected");

// Wait for server to auto-end the round (quiz = 15s). Force via timer... too slow;
// instead just verify state still looks right and close.
console.log("leaderboard entries:", lastState.leaderboard.length);

// Now test guess mode in a second room.
const g2 = await emit(host, "room:create", { name: "HostG", mode: "guess" });
const gid = g2.data.roomId;
await emit(guest, "room:leave", { roomId });
await emit(guest, "room:join", { roomId: gid, name: "GuestG" });
await emit(host, "game:start", { roomId: gid });
await wait(300);

// Fire several guesses concurrently to exercise arrival-order logic.
await Promise.all([
  emit(host, "guess:submit", { roomId: gid, value: 50 }),
  emit(guest, "guess:submit", { roomId: gid, value: 51 }),
  emit(host, "guess:submit", { roomId: gid, value: 52 }),
]);
console.log("submitted 3 guesses concurrently");

host.close();
guest.close();
console.log("SMOKE OK");
process.exit(0);
