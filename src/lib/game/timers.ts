// Centralized per-room timer registry so round-end logic and timer broadcasts
// share one scheduler. Kept out of UI to make distributed concepts easier to
// reason about.

type TimerHandle = {
  endTimeout: NodeJS.Timeout;
  tickInterval: NodeJS.Timeout;
  endsAt: number;
};

const handles = new Map<string, TimerHandle>();

export function startRoomTimer(
  roomId: string,
  durationMs: number,
  opts: {
    onTick: (endsAt: number, now: number) => void;
    onEnd: () => void;
    tickMs?: number;
  }
): number {
  cancelRoomTimer(roomId);
  const endsAt = Date.now() + durationMs;
  const tickInterval = setInterval(() => {
    opts.onTick(endsAt, Date.now());
  }, opts.tickMs ?? 500);
  const endTimeout = setTimeout(() => {
    cancelRoomTimer(roomId);
    opts.onEnd();
  }, durationMs);
  handles.set(roomId, { endTimeout, tickInterval, endsAt });
  return endsAt;
}

export function cancelRoomTimer(roomId: string): void {
  const h = handles.get(roomId);
  if (!h) return;
  clearTimeout(h.endTimeout);
  clearInterval(h.tickInterval);
  handles.delete(roomId);
}

export function getRoomEndsAt(roomId: string): number | undefined {
  return handles.get(roomId)?.endsAt;
}
