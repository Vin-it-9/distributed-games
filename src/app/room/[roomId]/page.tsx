"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket/client";
import { CLIENT_EVENTS, SERVER_EVENTS } from "@/lib/socket/events";
import { useGameStore } from "@/lib/store/game-store";
import type { PublicRoomState } from "@/lib/game/types";
import { Leaderboard } from "@/components/shared/Leaderboard";
import { LobbyPanel } from "@/components/lobby/LobbyPanel";
import { QuizPanel } from "@/components/quiz/QuizPanel";
import { GuessPanel } from "@/components/guess/GuessPanel";
import { HistoryPanel } from "@/components/shared/HistoryPanel";
import { ConnectionBadge } from "@/components/shared/ConnectionBadge";

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const roomId = params.roomId;

  const {
    session,
    hydrateSessionFromStorage,
    persistSession,
    clearSession,
    setConnected,
    connected,
  } = useGameStore();

  const [room, setRoom] = useState<PublicRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejoinAttempted, setRejoinAttempted] = useState(false);

  const selfId = session?.playerId;
  const isHost = useMemo(
    () => !!room && !!selfId && room.hostId === selfId,
    [room, selfId]
  );

  // ---------- session hydration + rejoin ----------
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
      // Try a rejoin every time we connect (covers refresh + reconnect).
      sock.emit(
        CLIENT_EVENTS.REJOIN,
        { roomId, sessionToken: session.sessionToken },
        (res) => {
          setRejoinAttempted(true);
          if (!res.ok) {
            setError(`rejoin failed: ${res.error}`);
            clearSession();
            router.replace("/");
          }
        }
      );
    };
    const onDisc = () => setConnected(false);
    const onState = (state: PublicRoomState) => {
      if (state.roomId === roomId) setRoom(state);
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
  }, [session, roomId, setConnected, clearSession, router]);

  if (!session) return <div className="panel">loading session…</div>;
  if (!rejoinAttempted && !room)
    return <div className="panel">connecting to room…</div>;
  if (!room) return <div className="panel">no room state received</div>;

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

  // ---------- game panels ----------
  const active =
    room.status === "in-round" || room.status === "round-ended";
  const showQuiz = room.mode === "quiz" && active;
  const showGuess = room.mode === "guess" && active;

  return (
    <main className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
      {/* LEFT COLUMN ---------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="label">room</div>
              <div className="text-lg font-semibold tracking-tight">
                {roomId}
                <span className="ml-3 chip">{room.mode}</span>
                <span className="ml-2 chip">{room.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ConnectionBadge />
              <button className="btn btn-danger" onClick={onLeave}>
                leave
              </button>
            </div>
          </div>
        </section>

        {room.status === "lobby" && (
          <section className="panel">
            <LobbyPanel
              room={room}
              selfId={selfId}
              onStart={onStart}
              canStart={isHost}
            />
          </section>
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

        {room.status === "finished" && (
          <section className="panel">
            <div className="label">game finished</div>
            <h3 className="mt-1 text-base font-semibold">Final standings</h3>
            <div className="mt-3">
              <Leaderboard entries={room.leaderboard} highlightId={selfId} />
            </div>
            {isHost && (
              <div className="mt-4 flex gap-2">
                <button className="btn btn-primary" onClick={onStart}>
                  play again
                </button>
                <button className="btn" onClick={onReset}>
                  reset
                </button>
              </div>
            )}
          </section>
        )}

        {isHost && (room.status === "round-ended" || room.status === "in-round") && (
          <section className="panel">
            <div className="label">host controls</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                className="btn btn-primary"
                onClick={onNext}
                disabled={room.status !== "round-ended"}
              >
                next round
              </button>
              <button className="btn" onClick={onReset}>
                reset game
              </button>
            </div>
            <div className="mt-2 label">
              only the host can advance rounds. server will auto-end a round
              when its timer elapses.
            </div>
          </section>
        )}
      </div>

      {/* RIGHT COLUMN --------------------------------------------------- */}
      <div className="flex flex-col gap-4">
        <section className="panel">
          <div className="label">leaderboard</div>
          <h3 className="mt-1 mb-3 text-base font-semibold">Live standings</h3>
          <Leaderboard entries={room.leaderboard} highlightId={selfId} />
        </section>

        <section className="panel">
          <div className="label">players</div>
          <ul className="mt-2 space-y-1 text-xs">
            {room.players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded border border-border px-2 py-1"
              >
                <span className="truncate">
                  {p.name}
                  {p.isHost && (
                    <span className="ml-2 text-yellow-400">host</span>
                  )}
                  {p.id === selfId && (
                    <span className="ml-2 text-accent">you</span>
                  )}
                </span>
                <span className={p.connected ? "chip chip-good" : "chip chip-bad"}>
                  {p.connected ? "online" : "offline"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="label">round history</div>
          <div className="mt-2">
            <HistoryPanel room={room} />
          </div>
        </section>

        <section className="panel">
          <div className="label">debug · demo info</div>
          <ul className="mt-2 space-y-1 text-xs text-slate-300">
            <li>mode: {room.mode}</li>
            <li>status: {room.status}</li>
            <li>round: {room.roundNumber}</li>
            <li>players: {room.players.length}</li>
            <li>connected: {String(connected)}</li>
          </ul>
        </section>

        {error && (
          <div className="panel border-bad text-xs text-red-300">{error}</div>
        )}
      </div>
    </main>
  );
}
