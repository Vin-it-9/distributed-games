"use client";

import type { PublicRoomState } from "@/lib/game/types";
import { GAME_META } from "@/lib/game/types";
import { Icon } from "@/components/shared/Icon";

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
  const meta = GAME_META[room.mode];
  return (
    <div className="glass p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl grid place-items-center bg-gradient-to-br from-gh-accent/30 to-gh-purple/30 border border-white/10">
          <Icon name={meta.icon} size={22} />
        </div>
        <div className="min-w-0">
          <div className="label">lobby</div>
          <h3 className="text-base font-semibold">{meta.title}</h3>
        </div>
        <span className="ml-auto chip">
          <Icon name="group" size={12} /> {room.players.length}
        </span>
      </div>

      <p className="text-xs text-gh-muted mb-3">{meta.blurb}</p>

      <ul className="mb-4 space-y-1">
        {room.players.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 text-sm"
          >
            <span className="truncate flex items-center gap-2">
              {p.name}
              {p.id === selfId && (
                <span className="chip chip-accent text-[10px]">you</span>
              )}
              {p.isHost && (
                <span className="chip chip-warn text-[10px]">
                  <Icon name="star" size={10} /> host
                </span>
              )}
            </span>
            <span className={p.connected ? "chip chip-good" : "chip chip-bad"}>
              <Icon name={p.connected ? "wifi" : "wifi_off"} size={10} />
              {p.connected ? "online" : "offline"}
            </span>
          </li>
        ))}
      </ul>

      {canStart ? (
        <button className="btn btn-primary w-full pulse-ring" onClick={onStart}>
          <Icon name="play_arrow" size={16} /> start game
        </button>
      ) : (
        <div className="text-center text-xs text-gh-muted">
          waiting for host to start…
        </div>
      )}
    </div>
  );
}
