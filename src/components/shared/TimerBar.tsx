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
  const color = pct > 50 ? "bg-good" : pct > 20 ? "bg-warn" : "bg-bad";
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">time remaining</span>
        <span className="text-xs text-slate-300">
          {(remaining / 1000).toFixed(1)}s
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full border border-border bg-[#0e1420]">
        <div
          className={`h-full ${color} transition-[width] duration-100`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
