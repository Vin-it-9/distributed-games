"use client";

import type { PublicRoomState } from "@/lib/game/types";

export function LobbyPanel({
  room,
  selfId,
  onStart,
  canStart,
}: {
  room: PublicRoomState;
  selfId?: string;
  onStart: () => void;
  canStart: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Lobby</h3>
        <span className="chip">{room.players.length} players</span>
      </div>
      <ul className="mb-4 space-y-1">
        {room.players.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded border border-border px-2 py-1"
          >
            <span className="truncate">
              {p.name}
              {p.id === selfId && <span className="ml-2 text-accent">(you)</span>}
              {p.isHost && <span className="ml-2 text-yellow-400">host</span>}
            </span>
            <span
              className={p.connected ? "chip chip-good" : "chip chip-bad"}
            >
              {p.connected ? "online" : "offline"}
            </span>
          </li>
        ))}
      </ul>
      {canStart ? (
        <button className="btn btn-primary w-full" onClick={onStart}>
          start game
        </button>
      ) : (
        <div className="label">waiting for host to start…</div>
      )}
    </div>
  );
}
