"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TurnTimer({
  turnDeadlineAt,
  pickTimeLimitSeconds,
  isMyTurn,
  onExpire,
  timeLabel,
}: {
  turnDeadlineAt: string | null;
  pickTimeLimitSeconds: number | null;
  isMyTurn: boolean;
  onExpire?: () => void;
  timeLabel?: string;
}) {
  const active = Boolean(pickTimeLimitSeconds && turnDeadlineAt);
  const deadlineMs = turnDeadlineAt ? new Date(turnDeadlineAt).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    if (!active) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => clearInterval(interval);
  }, [active, deadlineMs]);

  useEffect(() => {
    if (!active) return;

    const remainingMs = deadlineMs - now;
    if (remainingMs <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire?.();
    }
  }, [active, deadlineMs, now, onExpire]);

  if (!active) {
    return null;
  }

  const remainingMs = deadlineMs - now;
  const urgent = remainingMs <= 5_000;
  const progress = Math.max(
    0,
    Math.min(100, (remainingMs / (pickTimeLimitSeconds! * 1000)) * 100)
  );

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-on-pitch-subtle">
          {timeLabel ?? (isMyTurn ? "Seu tempo" : "Tempo do oponente")}
        </span>
        <span
          className={cn(
            "font-mono font-semibold",
            urgent ? "text-red-300" : "text-gold-light"
          )}
        >
          {formatRemaining(remainingMs)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-off-white/10">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            urgent ? "bg-red-400" : "bg-gold/80"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
