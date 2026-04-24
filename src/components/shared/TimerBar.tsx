"use client";

import { useEffect, useState } from "react";

export function TimerBar({
  endsAt,
  durationMs,
}: {
  endsAt: number;
  durationMs: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, endsAt - now);
  const pct = Math.max(0, Math.min(100, (remaining / durationMs) * 100));
  const gradient =
    pct > 50
      ? "linear-gradient(90deg, #3fb950, #2f81f7)"
      : pct > 20
        ? "linear-gradient(90deg, #d29922, #e5a838)"
        : "linear-gradient(90deg, #f85149, #db61a2)";
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">time remaining</span>
        <span className="text-xs text-gh-fg mono-tight tabular-nums">
          {(remaining / 1000).toFixed(1)}s
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full border border-white/5 bg-black/40">
        <div
          className="h-full transition-[width] duration-100"
          style={{ width: `${pct}%`, background: gradient }}
        />
      </div>
    </div>
  );
}
