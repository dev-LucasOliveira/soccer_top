"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AvailablePlayersCard } from "@/components/available-players-card";
import { UmSoHintsPanel } from "@/components/um-so-hud";
import { Badge } from "@/components/ui/badge";
import { getGuestToken } from "@/lib/guest";
import { filtersToSearchParams } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { DueloViewState } from "@/lib/types";

type Player = {
  id: string;
  name: string;
  primaryPosition: string;
  nationality: string;
};

type Participant = {
  id: string;
  displayName: string;
};

export function DueloPlayView({
  sessionCode,
  participantId,
  participants,
  initialView,
}: {
  sessionCode: string;
  participantId: string;
  participants: Participant[];
  initialView: DueloViewState | null;
}) {
  const router = useRouter();
  const [view, setView] = useState<DueloViewState | null>(initialView);
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success" | "duplicate" | "hint" | "round" | "wait" | "final";
    message: string;
  } | null>(null);

  const roundFilters = useMemo(
    () => view?.searchFilters ?? {},
    [view?.searchFilters]
  );

  const fetchSession = useCallback(async () => {
    const res = await fetch(
      `/api/sessions/${sessionCode}?participantId=${participantId}`
    );
    const data = await res.json();
    if (!res.ok) return;

    if (data.status === "completed") {
      router.replace(`/s/${sessionCode}/results`);
      return;
    }

    if (data.dueloView) {
      setView(data.dueloView);
    }
  }, [sessionCode, participantId, router]);

  useEffect(() => {
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  useEffect(() => {
    if (!search || search.length < 2) {
      setPlayers([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const params = filtersToSearchParams(roundFilters);
    params.set("search", search);

    fetch(`/api/players?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data.players ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [search, roundFilters]);

  async function handlePick(player: Player) {
    if (picking || !view?.isMyTurn) return;
    setPicking(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/sessions/${sessionCode}/duelo/pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
          playerId: player.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao palpitar");

      if (data.duplicate) {
        setFeedback({
          type: "duplicate",
          message: "Você já tentou esse jogador nesta rodada.",
        });
        if (data.view) setView(data.view);
        return;
      }

      if (data.view) setView(data.view);

      if (data.correct) {
        setFeedback({
          type: "success",
          message: `${data.scoring?.tierLabel ?? "Acertou"}! +${data.scoring?.points ?? 0} pts`,
        });
        if (data.sessionCompleted) {
          setTimeout(() => router.replace(`/s/${sessionCode}/results`), 1200);
        } else if (data.roundCompleted) {
          setTimeout(() => {
            setSearch("");
            setFeedback({
              type: "round",
              message: "Rodada encerrada — próximo tema em instantes…",
            });
            fetchSession();
          }, 900);
        }
        return;
      }

      if (data.roundFailed || data.sessionCompleted) {
        setFeedback({
          type: "final",
          message: data.view?.secretReveal
            ? `Ninguém acertou — era ${data.view.secretReveal.playerName}.`
            : "Ninguém acertou — duelo encerrado.",
        });
        setTimeout(() => router.replace(`/s/${sessionCode}/results`), 1500);
        return;
      }

      const newHint = data.view?.hintsRevealed?.at(-1);
      if (newHint && data.view.hintsRevealed.length > (view?.hintsRevealed.length ?? 0)) {
        setFeedback({
          type: "hint",
          message: `Errou — nova dica: ${newHint.label} — ${newHint.text}`,
        });
      } else {
        setFeedback({
          type: "error",
          message: `${player.name} não é o jogador secreto.`,
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao palpitar",
      });
    } finally {
      setPicking(false);
    }
  }

  if (!view) {
    return (
      <p className="loading-pulse text-center text-on-pitch-muted">
        Carregando duelo...
      </p>
    );
  }

  const hintsShown = view.hintsRevealed.length;
  const atLastHint = hintsShown >= view.totalHints;

  return (
    <div>
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gold-light/80">
              Rodada {view.roundNumber}/{view.totalRounds}
            </p>
            <h2 className="font-display text-xl text-off-white">{view.title}</h2>
            <p className="mt-1 text-sm text-on-pitch-muted">{view.description}</p>
          </div>
          <Badge
            variant={view.isMyTurn ? "gold" : "warning"}
            className="self-start"
          >
            {view.isMyTurn ? "Sua vez" : `Vez de ${view.activeParticipantName}`}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {participants.map((p) => (
            <div
              key={p.id}
              className={cn(
                "rounded-xl px-3 py-3 text-center",
                p.id === view.activeParticipantId && view.roundStatus === "open"
                  ? "bg-gold/15 ring-1 ring-gold/40"
                  : "bg-off-white/[0.06]"
              )}
            >
              <p className="truncate text-xs text-on-pitch-subtle">
                {p.displayName}
                {p.id === participantId && " (você)"}
              </p>
              <p className="font-display text-lg text-gold-light">
                {view.scores[p.id] ?? 0}
              </p>
              <p className="text-xs text-on-pitch-muted">
                {view.roundsWon[p.id] ?? 0} rodada(s)
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-on-pitch-subtle">Nível de dicas</span>
            <span
              className={cn(
                "font-medium",
                atLastHint ? "text-amber-300" : "text-gold-light/90"
              )}
            >
              {hintsShown}/{view.totalHints}
              {atLastHint && view.roundStatus === "open" && " — última chance"}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: view.totalHints }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  i < hintsShown
                    ? atLastHint && i === view.totalHints - 1
                      ? "bg-amber-400/80"
                      : "bg-gold/70"
                    : "bg-off-white/10"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <UmSoHintsPanel hints={view.hintsRevealed} totalHints={view.totalHints} />

      {view.secretReveal && view.roundStatus !== "open" && (
        <div className="mb-4 rounded-xl border border-pitch-bright/30 bg-pitch-bright/10 px-4 py-3">
          <p className="text-sm text-pitch-bright">
            Jogador secreto: <strong>{view.secretReveal.playerName}</strong>
          </p>
          {view.lastWinner && (
            <p className="mt-1 text-xs text-on-pitch-muted">
              {view.lastWinner.displayName} ganhou {view.lastWinner.points} pts (
              {view.lastWinner.tierLabel})
            </p>
          )}
        </div>
      )}

      {view.roundStatus === "open" && (
        <div className="mb-4">
          <AvailablePlayersCard
            search={search}
            onSearchChange={setSearch}
            players={players}
            loading={loading}
            canSearch={view.isMyTurn && search.length >= 2}
            topCount={0}
            topN={1}
            onAddPlayer={handlePick}
          />
          {!view.isMyTurn && (
            <p className="mt-2 text-center text-sm text-on-pitch-muted">
              Aguardando {view.activeParticipantName}…
            </p>
          )}
        </div>
      )}

      {feedback && (
        <p
          className={cn(
            "mb-4 text-sm",
            feedback.type === "error" || feedback.type === "final"
              ? "text-red-300"
              : feedback.type === "duplicate"
                ? "text-on-pitch-muted"
                : "text-pitch-bright"
          )}
          role="status"
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
