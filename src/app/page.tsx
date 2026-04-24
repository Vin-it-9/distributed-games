"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket/client";
import { CLIENT_EVENTS, SERVER_EVENTS } from "@/lib/socket/events";
import { useGameStore } from "@/lib/store/game-store";
import type { GameMode } from "@/lib/game/types";

export default function HomePage() {
  const router = useRouter();
  const persistSession = useGameStore((s) => s.persistSession);
  const setConnected = useGameStore((s) => s.setConnected);
  const connected = useGameStore((s) => s.connected);

  const [name, setName] = useState("");
  const [mode, setMode] = useState<GameMode>("quiz");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sock = getSocket();
    const onConn = () => setConnected(true);
    const onDisc = () => setConnected(false);
    sock.on("connect", onConn);
    sock.on("disconnect", onDisc);
    if (sock.connected) setConnected(true);
    return () => {
      sock.off("connect", onConn);
      sock.off("disconnect", onDisc);
    };
  }, [setConnected]);

  async function onCreate() {
    if (!name.trim()) return setError("enter a display name");
    setBusy(true);
    setError(null);
    const sock = getSocket();
    sock.emit(
      CLIENT_EVENTS.ROOM_CREATE,
      { name: name.trim(), mode },
      (res) => {
        setBusy(false);
        if (!res.ok) return setError(res.error);
        persistSession({
          roomId: res.data!.roomId,
          playerId: res.data!.playerId,
          sessionToken: res.data!.sessionToken,
        });
        router.push(`/room/${res.data!.roomId}`);
      }
    );
  }

  async function onJoin() {
    if (!name.trim()) return setError("enter a display name");
    if (!joinRoomId.trim()) return setError("enter a room id");
    setBusy(true);
    setError(null);
    const sock = getSocket();
    sock.emit(
      CLIENT_EVENTS.ROOM_JOIN,
      { name: name.trim(), roomId: joinRoomId.trim() },
      (res) => {
        setBusy(false);
        if (!res.ok) return setError(res.error);
        persistSession({
          roomId: joinRoomId.trim(),
          playerId: res.data!.playerId,
          sessionToken: res.data!.sessionToken,
        });
        router.push(`/room/${joinRoomId.trim()}`);
      }
    );
  }

  return (
    <main className="grid gap-4 md:grid-cols-2">
      <section className="panel">
        <div className="label">create a room</div>
        <h2 className="mt-1 mb-3 text-base font-semibold">Host a new game</h2>
        <label className="label">display name</label>
        <input
          className="fld mt-1 mb-3"
          placeholder="e.g. vineet"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="label">game mode</label>
        <select
          className="fld mt-1 mb-4"
          value={mode}
          onChange={(e) => setMode(e.target.value as GameMode)}
        >
          <option value="quiz">Multiplayer Quiz</option>
          <option value="guess">Number Guessing</option>
        </select>
        <button
          className="btn btn-primary w-full"
          disabled={busy || !connected}
          onClick={onCreate}
        >
          {busy ? "creating…" : "create room"}
        </button>
      </section>

      <section className="panel">
        <div className="label">join existing</div>
        <h2 className="mt-1 mb-3 text-base font-semibold">Join a room</h2>
        <label className="label">display name</label>
        <input
          className="fld mt-1 mb-3"
          placeholder="e.g. vineet"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="label">room id</label>
        <input
          className="fld mt-1 mb-4"
          placeholder="8-character code"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
        />
        <button
          className="btn w-full"
          disabled={busy || !connected}
          onClick={onJoin}
        >
          {busy ? "joining…" : "join room"}
        </button>
      </section>

      {error && (
        <div className="panel md:col-span-2 border-bad text-red-300">
          {error}
        </div>
      )}

      <section className="panel md:col-span-2">
        <div className="label">about</div>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
          Distributed demo: the Next.js server is the source of truth for room
          state, timers, scoring and winner resolution. Clients only render and
          submit input. Room state lives in process memory and resets on server
          restart.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="chip">broadcast</span>
          <span className="chip">leaderboard sync</span>
          <span className="chip">timeout handling</span>
          <span className="chip">concurrency</span>
          <span className="chip">race resolution</span>
          <span className="chip">fairness rules</span>
        </div>
        <div className="mt-3 label">
          connection:{" "}
          <span className={connected ? "chip chip-good" : "chip chip-bad"}>
            {connected ? "online" : "offline"}
          </span>
        </div>
      </section>
    </main>
  );
}

// The SERVER_EVENTS import keeps the file honest for future listeners; unused today.
void SERVER_EVENTS;
