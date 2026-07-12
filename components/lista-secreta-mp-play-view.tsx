"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AvailablePlayersCard } from "@/components/available-players-card";
import { GuessTopSlot } from "@/components/guess-top-hud";
import { Badge } from "@/components/ui/badge";
import { getGuestToken } from "@/lib/guest";
import { filtersToSearchParams } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { ListaSecretaMpViewState } from "@/lib/types";

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

export function ListaSecretaMpPlayView({
  sessionCode,
  participantId,
  participants,
  initialView,
}: {
  sessionCode: string;
  participantId: string;
  participants: Participant[];
  initialView: ListaSecretaMpViewState | null;
}) {
  const router = useRouter();
  const [view, setView] = useState<ListaSecretaMpViewState | null>(initialView);
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success" | "duplicate" | "round" | "wait";
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

    if (data.listaSecretaMpView) {
      setView(data.listaSecretaMpView);
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
      const res = await fetch(`/api/sessions/${sessionCode}/lista-secreta/pick`, {
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
          message: `Acertou! ${player.name} revelado.`,
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

      setFeedback({
        type: "error",
        message: `${player.name} não está na lista secreta.`,
      });
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
        Carregando partida...
      </p>
    );
  }

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
                view.playerColors[p.id] === "host"
                  ? "bg-gold/10 ring-1 ring-gold/30"
                  : "bg-pitch-bright/10 ring-1 ring-pitch-bright/30"
              )}
            >
              <p className="truncate text-xs text-on-pitch-subtle">
                {p.displayName}
                {p.id === participantId && " (você)"}
              </p>
              <p className="font-display text-lg text-off-white">
                {view.slotWins[p.id] ?? 0}
              </p>
              <p className="text-xs text-on-pitch-muted">
                slots nesta rodada · {view.roundsWon[p.id] ?? 0} rodada(s)
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <p className="text-xs uppercase tracking-wide text-gold-light/80">
          Lista secreta ({view.slots.filter((s) => s.revealed).length}/
          {view.slots.length} revelados)
        </p>
        {view.slots.map((slot) => (
          <GuessTopSlot
            key={slot.slotIndex}
            hintLabel={slot.hintLabel}
            nationality={slot.nationality}
            position={slot.position}
            showMetaHint={slot.showMetaHint}
            ownerColor={slot.revealed?.ownerColor}
            revealed={
              slot.revealed
                ? {
                    slotIndex: slot.slotIndex,
                    playerId: "",
                    playerName: slot.revealed.playerName,
                    nationality: slot.revealed.nationality,
                    position: slot.revealed.position,
                    hintLabel: slot.revealed.hintLabel,
                  }
                : undefined
            }
          />
        ))}
      </div>

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
            feedback.type === "error"
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
