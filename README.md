# distributed-games

**Distributed Multiplayer Games using Next.js and WebSockets.**
A single Next.js server acts as the source of truth for rooms, players, game
state, timers, scoring, and leaderboards. Browsers connect via Socket.IO and
render live updates.

Five modes in one app:

- **Multiplayer Quiz** — server pushes a question, all clients answer before
  timeout, server scores by correctness plus speed bonus.
- **Number Guessing** — server generates a secret target, clients guess
  concurrently, server resolves the winner fairly by arrival order.
- **Math Sprint** — fast arithmetic problems; first correct typed answer wins.
- **Word Scramble** — unscramble the word; first to type the original wins.
- **Emoji Decode** — decode the movie / phrase hidden in emoji; first correct wins.

The UI uses a GitHub dark palette with Apple-style glassmorphism panels and
Google Material Symbols icons.

There is no database. All room state lives in process memory and resets when
the server restarts — the project is intentionally simple so the distributed
concepts stay easy to explain.

---

## Tech stack

- Next.js 15 (App Router) with TypeScript
- Custom Node HTTP server so Socket.IO can attach on the same port
- Socket.IO for rooms, broadcasts, acknowledgements, and auto-reconnect
- Tailwind CSS for compact, functional UI
- Zustand for client state
- Zod for server-side payload validation
- nanoid for room and player IDs

---

## Deployment (Render free tier)

> **Do not deploy this to Vercel or GitHub Pages.** Vercel's serverless
> functions can't hold open WebSocket connections, and GitHub Pages is a
> static file host — both will load the home page but every socket
> handshake (`wss://…/api/socket`) will fail.

`render.yaml` in the repo root does the entire setup.

1. Go to https://dashboard.render.com/blueprints.
2. Click **New Blueprint Instance** and pick this repo.
3. Click **Apply**. Render builds and gives you a
   `https://<your-app>.onrender.com` URL in about 3 minutes.

Free instances sleep after ~15 min idle and take ~30 s to wake on the
next request — room state resets when that happens. Upgrade to a paid
instance if you want continuous uptime.

---

## Running locally

```bash
npm install
npm run dev          # http://localhost:3000
```

`npm run build` compiles Next.js; `npm start` runs the same custom server in
production mode. Socket.IO is mounted at `/api/socket`.

Open two browsers, have one create a room and the other join with the room id.

---

## Project layout

```
server.ts                          # custom Next + Socket.IO server
src/
  app/
    page.tsx                       # home: create or join a room
    room/[roomId]/page.tsx         # shared room page (lobby/round/leaderboard)
  components/
    lobby/LobbyPanel.tsx
    quiz/QuizPanel.tsx
    guess/GuessPanel.tsx
    shared/{Leaderboard,TimerBar,HistoryPanel,ConnectionBadge}.tsx
  lib/
    socket/
      client.ts                    # singleton socket.io-client wrapper
      events.ts                    # shared event names + typed signatures
    game/
      types.ts                     # domain models (Player, RoomState, rounds)
      schemas.ts                   # Zod payload schemas
      room-store.ts                # in-memory Map<string, RoomState>
      quiz-engine.ts               # quiz round lifecycle + scoring
      guess-engine.ts              # guess round lifecycle + scoring
      timers.ts                    # per-room timer scheduler
      fairness.ts                  # server-side winner resolution rules
    data/
      questions.ts                 # quiz question bank
    store/
      game-store.ts                # Zustand store (session, room, timers)
  server/
    socket.ts                      # Socket.IO event handlers
```

---

## Distributed concepts mapping

| Concept                  | Quiz                                                        | Guess                                                                  |
| ------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Broadcast communication  | Server sends question, timer, result to all at once.        | Server sends round start and winner/result to all.                     |
| Leaderboard sync         | Server recalculates after each round and broadcasts.        | Server updates scores centrally, broadcasts to all clients.            |
| Timeout handling         | Round closes on timer expiry; late answers rejected.        | Guess window closes on timer or instant exact win.                     |
| Concurrency              | Many answers can arrive near-simultaneously.                | Many guesses can arrive near-simultaneously.                           |
| Race conditions          | Server keeps only the first answer per player.              | Server arrival order breaks ties deterministically.                    |
| Fairness                 | Same question, same timer, same scoring for everyone.       | Only server knows target; only server picks the winner.                |

### Fairness rules — guessing

1. Only the server knows the target number.
2. Every guess gets a server receive timestamp.
3. The first **exact** valid guess wins and ends the round immediately.
4. If no exact guess arrives before timeout, the **nearest** guess wins.
5. Ties break by earliest server receipt.
6. After winner selection the round is locked and further guesses are rejected.

### Fairness rules — quiz

- One answer per player per round.
- Server stores the first valid answer; late or duplicate answers are discarded.
- Score = correctness + a speed bonus derived from remaining timer.

---

## Socket events

Client → server (validated with Zod):

- `room:create`, `room:join`, `room:leave`
- `session:rejoin`
- `game:start`, `round:next`, `game:reset`
- `quiz:submit-answer`, `guess:submit`, `race:submit-answer`

Server → client:

- `room:state`, `player:joined`, `player:left`
- `game:started`, `round:started`, `round:ended`, `game:finished`
- `timer:update`, `leaderboard:update`
- `session:assigned`, `error:message`

---

## Risks and limitations

- Room state disappears on server restart (no DB).
- Horizontal scaling across instances would need shared memory or a Redis
  adapter for Socket.IO.
- Serverless deployment (e.g. Vercel functions) is not suitable for persistent
  WebSocket connections — deploy as a long-running Node process.
- Reconnection support is in-memory only (per-session token in the room).

---

## Room codes

Room codes are 6-character uppercase strings drawn from a curated alphabet
that excludes visually ambiguous characters (`0/O`, `1/I/L`, `5/S`). Clients
normalize typed codes (trim + uppercase) so `ab3k9z` and `AB3K9Z` are the
same room.

---

## Build order used

1. Shared types, Zod schemas, event contracts.
2. In-memory room store, timer registry, fairness logic.
3. Quiz engine, then guess engine.
4. Socket handlers with validation and broadcasts.
5. Home, lobby, quiz panel, guess panel, leaderboard, history.
6. Host controls, rejoin handling, round history, polish.
