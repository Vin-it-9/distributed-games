"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket/client";
import { CLIENT_EVENTS, SERVER_EVENTS } from "@/lib/socket/events";
import { useGameStore } from "@/lib/store/game-store";
import type { PublicRoomState } from "@/lib/game/types";
import { GAME_META } from "@/lib/game/types";
import { Leaderboard } from "@/components/shared/Leaderboard";
import { LobbyPanel } from "@/components/lobby/LobbyPanel";
import { QuizPanel } from "@/components/quiz/QuizPanel";
import { GuessPanel } from "@/components/guess/GuessPanel";
import { RacePanel } from "@/components/guess/RacePanel";
import { HistoryPanel } from "@/components/shared/HistoryPanel";
import { ConnectionBadge } from "@/components/shared/ConnectionBadge";
import { Icon } from "@/components/shared/Icon";
import { normalizeRoomId } from "@/lib/game/ids";

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const rawRoomId = params.roomId;
  const roomId = useMemo(() => normalizeRoomId(rawRoomId || ""), [rawRoomId]);

  const {
    session,
    hydrateSessionFromStorage,
    clearSession,
    setConnected,
    connected,
  } = useGameStore();

  const [room, setRoom] = useState<PublicRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejoinFailed, setRejoinFailed] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);

  const selfId = session?.playerId;
  const isHost = useMemo(
    () => !!room && !!selfId && room.hostId === selfId,
    [room, selfId]
  );

  // ---------- session hydration ----------
  useEffect(() => {
    const existing = hydrateSessionFromStorage();
    if (!existing || existing.roomId !== roomId) {
      router.replace("/");
    }
  }, [hydrateSessionFromStorage, roomId, router]);

  // ---------- socket wiring ----------
  useEffect(() => {
    if (!session || session.roomId !== roomId) return;
    const sock = getSocket();

    const onConn = () => {
      setConnected(true);
      sock.emit(
        CLIENT_EVENTS.REJOIN,
        { roomId, sessionToken: session.sessionToken },
        (res) => {
          if (!res.ok) {
            setError(res.error);
            setRejoinFailed(true);
          }
        }
      );
    };
    const onDisc = () => setConnected(false);
    const onState = (state: PublicRoomState) => {
      if (state.roomId === roomId) {
        setRoom(state);
        setRejoinFailed(false);
      }
    };
    const onErr = ({ message }: { message: string }) => setError(message);

    sock.on("connect", onConn);
    sock.on("disconnect", onDisc);
    sock.on(SERVER_EVENTS.ROOM_STATE, onState);
    sock.on(SERVER_EVENTS.ROUND_STARTED, onState);
    sock.on(SERVER_EVENTS.ROUND_ENDED, onState);
    sock.on(SERVER_EVENTS.GAME_STARTED, onState);
    sock.on(SERVER_EVENTS.GAME_FINISHED, onState);
    sock.on(SERVER_EVENTS.ERROR, onErr);

    if (sock.connected) onConn();

    return () => {
      sock.off("connect", onConn);
      sock.off("disconnect", onDisc);
      sock.off(SERVER_EVENTS.ROOM_STATE, onState);
      sock.off(SERVER_EVENTS.ROUND_STARTED, onState);
      sock.off(SERVER_EVENTS.ROUND_ENDED, onState);
      sock.off(SERVER_EVENTS.GAME_STARTED, onState);
      sock.off(SERVER_EVENTS.GAME_FINISHED, onState);
      sock.off(SERVER_EVENTS.ERROR, onErr);
    };
  }, [session, roomId, setConnected]);

  // ---------- early states ----------
  if (!session) {
    return <div className="glass p-5 text-gh-muted">loading session…</div>;
  }

  if (rejoinFailed) {
    return (
      <div className="glass-strong p-6 text-center">
        <Icon name="error" size={28} className="text-gh-red" />
        <h2 className="mt-2 text-base font-semibold">Can&apos;t rejoin this room</h2>
        <p className="mt-1 text-sm text-gh-muted">
          {error ?? "The room may have ended or restarted."}
        </p>
        <button
          className="btn btn-primary mt-4"
          onClick={() => {
            clearSession();
            router.replace("/");
          }}
        >
          <Icon name="home" size={16} /> back to home
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="glass p-5 text-gh-muted flex items-center gap-2">
        <Icon name="progress_activity" size={16} />
        connecting to room…
      </div>
    );
  }

  // ---------- host actions ----------
  function onStart() {
    getSocket().emit(CLIENT_EVENTS.GAME_START, { roomId });
  }
  function onNext() {
    getSocket().emit(CLIENT_EVENTS.ROUND_NEXT, { roomId });
  }
  function onReset() {
    getSocket().emit(CLIENT_EVENTS.GAME_RESET, { roomId });
  }
  function onLeave() {
    getSocket().emit(CLIENT_EVENTS.ROOM_LEAVE, { roomId });
    clearSession();
    router.replace("/");
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1200);
    } catch {
      /* ignore */
    }
  }

  const meta = GAME_META[room.mode];
  const active = room.status === "in-round" || room.status === "round-ended";
  const showQuiz = room.mode === "quiz" && active;
  const showGuess = room.mode === "guess" && active;
  const showRace =
    (room.mode === "math" || room.mode === "scramble" || room.mode === "emoji") &&
    active;

  return (
    <main className="grid gap-4 md:grid-cols-[1.55fr_1fr]">
      {/* LEFT COLUMN ---------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        {/* Header */}
        <section className="glass-strong p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-10 w-10 rounded-xl grid place-items-center bg-gradient-to-br from-gh-accent/30 to-gh-purple/30 border border-white/10">
              <Icon name={meta.icon} size={22} />
            </div>
            <div>
              <div className="label">room code</div>
              <button
                className="flex items-center gap-2 mono-tight text-lg font-semibold tracking-[0.2em] hover:text-gh-accent"
                onClick={copyCode}
              >
                {roomId}
                <Icon
                  name={copyFlash ? "check" : "content_copy"}
                  size={14}
                  className={copyFlash ? "text-gh-green" : "text-gh-muted"}
                />
              </button>
            </div>
            <span className="chip">{meta.title}</span>
            <span
              className={`chip ${
                room.status === "in-round"
                  ? "chip-accent"
                  : room.status === "finished"
                    ? "chip-warn"
                    : ""
              }`}
            >
              {room.status}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <ConnectionBadge />
              <button className="btn btn-danger" onClick={onLeave}>
                <Icon name="logout" size={14} /> leave
              </button>
            </div>
          </div>
        </section>

        {room.status === "lobby" && (
          <LobbyPanel
            room={room}
            selfId={selfId}
            onStart={onStart}
            canStart={isHost}
          />
        )}

        {showQuiz && selfId && (
          <QuizPanel
            room={room}
            selfId={selfId}
            onSubmit={(idx) =>
              getSocket().emit(CLIENT_EVENTS.QUIZ_SUBMIT, {
                roomId,
                choiceIndex: idx,
              })
            }
          />
        )}

        {showGuess && (
          <GuessPanel
            room={room}
            onSubmit={(v) =>
              getSocket().emit(CLIENT_EVENTS.GUESS_SUBMIT, {
                roomId,
                value: v,
              })
            }
          />
        )}

        {showRace && selfId && (
          <RacePanel
            room={room}
            selfId={selfId}
            onSubmit={(text, cb) =>
              getSocket().emit(
                CLIENT_EVENTS.RACE_SUBMIT,
                { roomId, text },
                (res) => {
                  if (res && res.ok) cb?.(res.data?.correct ?? false);
                  else cb?.(false);
                }
              )
            }
          />
        )}

        {room.status === "finished" && (
          <section className="glass p-5 text-center">
            <Icon
              name="emoji_events"
              size={40}
              className="text-gh-amber"
              fill
            />
            <h3 className="mt-2 text-base font-semibold">Game finished</h3>
            <p className="text-xs text-gh-muted">
              final standings below — host can play again
            </p>
            <div className="mt-4 max-w-sm mx-auto">
              <Leaderboard entries={room.leaderboard} highlightId={selfId} />
            </div>
            {isHost && (
              <div className="mt-4 flex justify-center gap-2">
                <button className="btn btn-primary" onClick={onStart}>
                  <Icon name="refresh" size={16} /> play again
                </button>
                <button className="btn" onClick={onReset}>
                  <Icon name="restart_alt" size={16} /> reset
                </button>
              </div>
            )}
          </section>
        )}

        {isHost &&
          (room.status === "round-ended" || room.status === "in-round") && (
            <section className="glass p-4">
              <div className="label flex items-center gap-1">
                <Icon name="admin_panel_settings" size={14} /> host controls
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className="btn btn-primary"
                  onClick={onNext}
                  disabled={room.status !== "round-ended"}
                >
                  <Icon name="skip_next" size={16} /> next round
                </button>
                <button className="btn" onClick={onReset}>
                  <Icon name="restart_alt" size={16} /> reset game
                </button>
              </div>
              <div className="mt-2 text-[11px] text-gh-muted">
                only the host can advance. server auto-ends each round on
                timeout.
              </div>
            </section>
          )}
      </div>

      {/* RIGHT COLUMN --------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        <section className="glass p-4">
          <div className="label flex items-center gap-1">
            <Icon name="leaderboard" size={14} /> leaderboard
          </div>
          <h3 className="mt-1 mb-3 text-base font-semibold">Live standings</h3>
          <Leaderboard entries={room.leaderboard} highlightId={selfId} />
        </section>

        <section className="glass p-4">
          <div className="label flex items-center gap-1">
            <Icon name="groups" size={14} /> players
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            {room.players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1.5"
              >
                <span className="truncate flex items-center gap-1.5">
                  {p.name}
                  {p.isHost && (
                    <span className="chip chip-warn text-[10px]">host</span>
                  )}
                  {p.id === selfId && (
                    <span className="chip chip-accent text-[10px]">you</span>
                  )}
                </span>
                <span
                  className={p.connected ? "chip chip-good" : "chip chip-bad"}
                >
                  {p.connected ? "online" : "offline"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass p-4">
          <div className="label flex items-center gap-1">
            <Icon name="history" size={14} /> round history
          </div>
          <div className="mt-2">
            <HistoryPanel room={room} />
          </div>
        </section>

        <section className="glass-subtle p-4">
          <div className="label flex items-center gap-1">
            <Icon name="bug_report" size={14} /> demo info
          </div>
          <ul className="mt-2 space-y-1 text-xs text-gh-muted">
            <li>mode: <span className="text-gh-fg">{room.mode}</span></li>
            <li>status: <span className="text-gh-fg">{room.status}</span></li>
            <li>
              round:{" "}
              <span className="text-gh-fg">
                {room.roundNumber}/{room.totalRounds}
              </span>
            </li>
            <li>players: <span className="text-gh-fg">{room.players.length}</span></li>
            <li>
              connected: <span className="text-gh-fg">{String(connected)}</span>
            </li>
          </ul>
        </section>

        {error && !rejoinFailed && (
          <div className="glass p-3 border border-gh-red/40 text-gh-red text-xs flex items-center gap-2">
            <Icon name="error" size={14} /> {error}
          </div>
        )}
      </div>
    </main>
  );
}
