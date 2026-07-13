"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LEADERBOARD_MODES } from "@/lib/stats-game-modes";
import { APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  gamesPlayed: number;
  wins: number;
  totalScore: number;
  bestScore: number | null;
};

export default function CompeticaoPage() {
  const { data: session } = useSession();
  const [activeMode, setActiveMode] = useState(LEADERBOARD_MODES[0].id);
  const [scope, setScope] = useState<"global" | "friends">("global");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/leaderboard?mode=${encodeURIComponent(activeMode)}&scope=${scope}`
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Erro ao carregar ranking");
        setEntries([]);
        return;
      }
      setEntries(data.entries ?? []);
    } catch {
      setError("Erro ao carregar ranking");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [activeMode, scope]);

  useEffect(() => {
    if (scope === "friends" && !session?.user) {
      setScope("global");
      return;
    }
    loadLeaderboard();
  }, [loadLeaderboard, scope, session?.user]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="glass-dark rounded-2xl px-5 py-6">
        <h1 className="font-display text-2xl text-off-white">Competição global</h1>
        <p className="mt-1 text-sm text-on-pitch-muted">
          Rankings por modo no {APP_NAME}. Entre com Google para aparecer e comparar com amigos.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {LEADERBOARD_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setActiveMode(mode.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeMode === mode.id
                  ? "bg-pitch text-off-white"
                  : "bg-off-white/10 text-on-pitch-muted hover:text-off-white"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={scope === "global" ? "primary" : "secondary"}
            onClick={() => setScope("global")}
          >
            Global
          </Button>
          <Button
            type="button"
            size="sm"
            variant={scope === "friends" ? "primary" : "secondary"}
            disabled={!session?.user}
            onClick={() => setScope("friends")}
          >
            Amigos
          </Button>
        </div>
      </div>

      <section className="mt-6">
        {loading ? (
          <p className="text-center text-on-pitch-muted">Carregando ranking...</p>
        ) : error ? (
          <p className="text-center text-red-300">{error}</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-sm text-on-pitch-muted">
            Nenhum jogador no ranking deste modo ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <Link
                key={entry.userId}
                href={`/perfil/${entry.username}`}
                className="flex items-center gap-3 rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3 transition-colors hover:border-gold/30"
              >
                <span className="w-8 text-center font-display text-gold-light">
                  {entry.rank}
                </span>
                {entry.avatarUrl ? (
                  <Image
                    src={entry.avatarUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pitch-bright/20 text-sm text-pitch-bright">
                    {entry.displayName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-off-white">{entry.displayName}</p>
                  <p className="text-xs text-on-pitch-muted">
                    @{entry.username} · {entry.gamesPlayed} partidas · {entry.wins} vitórias
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-gold-light">
                    {entry.bestScore ?? entry.totalScore}
                  </p>
                  <p className="text-xs text-on-pitch-subtle">melhor</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {!session?.user && (
        <p className="mt-6 text-center text-sm text-on-pitch-muted">
          <Link href="/api/auth/signin" className="text-gold-light hover:underline">
            Entre com Google
          </Link>{" "}
          para registrar suas partidas e aparecer aqui.
        </p>
      )}
    </main>
  );
}
