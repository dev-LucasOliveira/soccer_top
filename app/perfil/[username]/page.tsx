"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/branding";

type ProfileData = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  modeStats: {
    gameMode: string;
    label: string;
    gamesPlayed: number;
    wins: number;
    totalScore: number;
    bestScore: number | null;
  }[];
  recentMatches: {
    id: string;
    gameMode: string;
    label: string;
    score: number;
    placement: number | null;
    playedAt: string;
  }[];
  friendshipStatus: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [username, setUsername] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    params.then((resolved) => setUsername(resolved.username));
  }, [params]);

  useEffect(() => {
    if (!username) return;

    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(username)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Usuário não encontrado");
          setProfile(null);
          return;
        }
        setProfile(data);
        setError("");
      })
      .catch(() => setError("Erro ao carregar perfil"))
      .finally(() => setLoading(false));
  }, [username]);

  async function handleAddFriend() {
    if (!profile) return;
    setActionLoading(true);
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: profile.username }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Erro ao enviar pedido");
        return;
      }
      setProfile({ ...profile, friendshipStatus: "pending_sent" });
    } catch {
      setError("Erro ao enviar pedido");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-center text-on-pitch-muted">Carregando...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="glass-dark rounded-2xl px-5 py-6 text-center">
          <p className="text-off-white">{error || "Usuário não encontrado"}</p>
          <Link href="/competicao" className="mt-4 inline-block text-sm text-gold-light">
            ← Voltar à competição
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="glass-dark rounded-2xl px-5 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pitch-bright/20 text-xl font-display text-pitch-bright">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl text-off-white">
                {profile.displayName}
              </h1>
              <p className="text-sm text-on-pitch-muted">@{profile.username}</p>
              <p className="mt-1 text-xs text-on-pitch-subtle">
                No {APP_NAME} desde {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>

          {profile.friendshipStatus === "none" && (
            <Button
              type="button"
              size="sm"
              disabled={actionLoading}
              onClick={handleAddFriend}
            >
              Adicionar amigo
            </Button>
          )}
          {profile.friendshipStatus === "pending_sent" && (
            <span className="text-sm text-on-pitch-muted">Pedido enviado</span>
          )}
          {profile.friendshipStatus === "pending_received" && (
            <span className="text-sm text-gold-light">Pedido pendente</span>
          )}
          {profile.friendshipStatus === "accepted" && (
            <span className="text-sm text-pitch-bright">Amigo</span>
          )}
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg text-off-white">Estatísticas</h2>
        {profile.modeStats.length === 0 ? (
          <p className="text-sm text-on-pitch-muted">Sem partidas registradas.</p>
        ) : (
          <div className="space-y-2">
            {profile.modeStats.map((stat) => (
              <div
                key={stat.gameMode}
                className="flex items-center justify-between rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="font-medium text-off-white">{stat.label}</p>
                  <p className="text-xs text-on-pitch-muted">
                    {stat.gamesPlayed} partidas · {stat.wins} vitórias
                  </p>
                </div>
                <p className="font-display text-gold-light">
                  {stat.bestScore ?? stat.totalScore}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg text-off-white">
          Partidas recentes
        </h2>
        {profile.recentMatches.length === 0 ? (
          <p className="text-sm text-on-pitch-muted">Nenhuma partida pública.</p>
        ) : (
          <div className="space-y-2">
            {profile.recentMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3 text-sm"
              >
                <div>
                  <p className="text-off-white">{match.label}</p>
                  <p className="text-xs text-on-pitch-muted">
                    {formatDate(match.playedAt)}
                  </p>
                </div>
                <span className="font-display text-gold-light">{match.score}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
