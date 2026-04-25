"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket/client";
import { CLIENT_EVENTS } from "@/lib/socket/events";
import { useGameStore } from "@/lib/store/game-store";
import { GAME_META, type GameMode } from "@/lib/game/types";
import { normalizeRoomId, isValidRoomId } from "@/lib/game/ids";
import { Icon } from "@/components/shared/Icon";

const LOCKED_MODE: GameMode = "math";
const UNLOCK_KEYWORD = "unlock";
const LOCK_KEYWORD = "lock";

export default function HomePage() {
  const router = useRouter();
  const persistSession = useGameStore((s) => s.persistSession);
  const setConnected = useGameStore((s) => s.setConnected);
  const connected = useGameStore((s) => s.connected);

  const [name, setName] = useState("");
  const [mode, setMode] = useState<GameMode>("math");
  const [availableModes, setAvailableModes] = useState<GameMode[]>(["math"]);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isUnlockName(value: string): boolean {
    return value.trim().toLowerCase() === UNLOCK_KEYWORD;
  }

  function isLockName(value: string): boolean {
    return value.trim().toLowerCase() === LOCK_KEYWORD;
  }

  function loadModes() {
    const sock = getSocket();
    sock.emit(CLIENT_EVENTS.MODES_GET, {}, (res) => {
      if (!res.ok) return;
      const modes = res.data?.modes?.length ? res.data.modes : [LOCKED_MODE];
      setAvailableModes(modes);
      setMode((current) => (modes.includes(current) ? current : modes[0]));
    });
  }

  useEffect(() => {
    const sock = getSocket();
    const onConn = () => {
      setConnected(true);
      loadModes();
    };
    const onDisc = () => setConnected(false);
    sock.on("connect", onConn);
    sock.on("disconnect", onDisc);
    if (sock.connected) onConn();
    return () => {
      sock.off("connect", onConn);
      sock.off("disconnect", onDisc);
    };
  }, [setConnected]);

  function validateName(): string | null {
    const trimmed = name.trim();
    if (!trimmed) return "please enter a display name";
    if (trimmed.length > 20) return "name too long (max 20 chars)";
    return null;
  }

  async function changeModesAndRefresh(action: "unlock" | "lock") {
    if (!connected) {
      setError("wait for connection and try again");
      return;
    }
    setBusy(true);
    setError(null);
    const sock = getSocket();
    const event =
      action === "unlock" ? CLIENT_EVENTS.MODES_UNLOCK : CLIENT_EVENTS.MODES_LOCK;
    sock.emit(event, {}, (res) => {
      setBusy(false);
      if (!res.ok) return setError(res.error);
      window.location.assign("/");
    });
  }

  async function onCreate() {
    if (isUnlockName(name)) {
      await changeModesAndRefresh("unlock");
      return;
    }
    if (isLockName(name)) {
      await changeModesAndRefresh("lock");
      return;
    }
    const err = validateName();
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    const sock = getSocket();
    sock.emit(CLIENT_EVENTS.ROOM_CREATE, { name: name.trim(), mode }, (res) => {
      setBusy(false);
      if (!res.ok) return setError(res.error);
      persistSession({
        roomId: res.data!.roomId,
        playerId: res.data!.playerId,
        sessionToken: res.data!.sessionToken,
      });
      router.push(`/room/${res.data!.roomId}`);
    });
  }

  async function onJoin() {
    if (isUnlockName(name)) {
      await changeModesAndRefresh("unlock");
      return;
    }
    if (isLockName(name)) {
      await changeModesAndRefresh("lock");
      return;
    }
    const err = validateName();
    if (err) return setError(err);
    const normalized = normalizeRoomId(joinRoomId);
    if (!isValidRoomId(normalized)) {
      return setError("room code looks invalid — 4-12 letters/digits");
    }
    setBusy(true);
    setError(null);
    const sock = getSocket();
    sock.emit(
      CLIENT_EVENTS.ROOM_JOIN,
      { name: name.trim(), roomId: normalized },
      (res) => {
        setBusy(false);
        if (!res.ok) return setError(res.error);
        persistSession({
          roomId: normalized,
          playerId: res.data!.playerId,
          sessionToken: res.data!.sessionToken,
        });
        router.push(`/room/${normalized}`);
      }
    );
  }

  return (
    <main className="grid gap-6">
      {/* Hero */}
      <section className="glass-strong p-6 md:p-8">
        <div className="flex items-center gap-2 text-gh-muted text-xs">
          <span
            className={connected ? "chip chip-good" : "chip chip-bad"}
            aria-live="polite"
          >
            <Icon name={connected ? "wifi" : "wifi_off"} size={12} />{" "}
            {connected ? "connected" : "offline"}
          </span>
          <span className="chip chip-accent">
            <Icon name="bolt" size={12} /> real-time
          </span>
          <span className="chip">
            <Icon name="memory" size={12} /> in-memory rooms
          </span>
        </div>
        <h1 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight">
          Pick a mode. <span className="gradient-text">Play together.</span>
        </h1>
        <p className="mt-2 text-gh-muted max-w-2xl">
          One Next.js server, five multiplayer games. The server is the source
          of truth — it broadcasts questions, enforces timeouts, and resolves
          winners fairly by arrival order.
        </p>
      </section>

      {/* Mode picker */}
      <section>
        <div className="label mb-2">choose a game</div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {availableModes.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`mode-card text-left ${mode === m ? "selected" : ""}`}
            >
              <div className="icon">
                <Icon name={GAME_META[m].icon} size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{GAME_META[m].title}</div>
                  {mode === m && (
                    <span className="chip chip-accent">
                      <Icon name="check" size={12} /> selected
                    </span>
                  )}
                </div>
                <div className="text-xs text-gh-muted mt-0.5">
                  {GAME_META[m].blurb}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-gh-muted">
                  {GAME_META[m].tag}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Create / Join panels */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass p-5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="add_circle" className="text-gh-accent" size={18} />
            <div className="label">create a room</div>
          </div>
          <h2 className="mb-4 text-base font-semibold">Host a new game</h2>

          <label className="label">display name</label>
          <input
            className="fld mt-1 mb-4"
            placeholder="your name"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (isUnlockName(name) || isLockName(name))) {
                e.preventDefault();
                void changeModesAndRefresh(isUnlockName(name) ? "unlock" : "lock");
              }
            }}
          />

          <div className="mb-4 flex items-center gap-2 text-xs text-gh-muted">
            <Icon name="sports_esports" size={14} />
            starting mode:{" "}
            <span className="text-gh-fg font-medium">
              {GAME_META[mode].title}
            </span>
          </div>

          <button
            className="btn btn-primary w-full"
            disabled={busy || !connected}
            onClick={() => {
              void onCreate();
            }}
          >
            {busy ? (
              "creating…"
            ) : (
              <>
                <Icon name="stadia_controller" size={16} />
                create room
              </>
            )}
          </button>
        </div>

        <div className="glass p-5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="login" className="text-gh-purple" size={18} />
            <div className="label">join existing</div>
          </div>
          <h2 className="mb-4 text-base font-semibold">Join a room</h2>

          <label className="label">display name</label>
          <input
            className="fld mt-1 mb-3"
            placeholder="your name"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (isUnlockName(name) || isLockName(name))) {
                e.preventDefault();
                void changeModesAndRefresh(isUnlockName(name) ? "unlock" : "lock");
              }
            }}
          />

          <label className="label">room code</label>
          <input
            className="fld mt-1 mb-4 mono-tight uppercase tracking-widest text-center text-base"
            placeholder="AB3K9Z"
            maxLength={8}
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(normalizeRoomId(e.target.value))}
          />

          <button
            className="btn w-full"
            disabled={busy || !connected}
            onClick={() => {
              void onJoin();
            }}
          >
            {busy ? (
              "joining…"
            ) : (
              <>
                <Icon name="arrow_forward" size={16} />
                join room
              </>
            )}
          </button>
        </div>
      </section>

      {error && (
        <div className="glass p-3 border border-gh-red/40 text-gh-red flex items-center gap-2">
          <Icon name="error" size={16} /> {error}
        </div>
      )}

      {/* Concept strip */}
      <section className="glass-subtle p-4">
        <div className="label mb-2">what you can show off</div>
        <div className="flex flex-wrap gap-2">
          {[
            "broadcast",
            "leaderboard sync",
            "timeout handling",
            "concurrency",
            "race resolution",
            "fairness rules",
            "server source of truth",
          ].map((c) => (
            <span className="chip" key={c}>
              {c}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
