"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildParticipantPath } from "@/lib/session-info";
import type { ImpostorViewState } from "@/lib/types";

function ListPreview({
  picks,
  targetRank,
  highlightRank,
}: {
  picks: ImpostorViewState["myPicks"];
  targetRank: number;
  highlightRank?: number;
}) {
  const slots = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-1.5">
      {slots.map((rank) => {
        const pick = picks.find((item) => item.rank === rank);
        const isCurrent = rank === targetRank;
        const isHighlight = rank === highlightRank;

        return (
          <div
            key={rank}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
              isHighlight
                ? "bg-gold/15 ring-1 ring-gold/30"
                : isCurrent
                  ? "border border-dashed border-gold/35 bg-off-white-muted/60"
                  : "bg-off-white-muted"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                rank === 1 ? "rank-badge-gold gold-chip" : "rank-badge-card"
              }`}
            >
              {rank}
            </span>
            <span className="font-medium text-foreground">
              {pick?.playerName ??
                (isCurrent ? "Escolha sua carta abaixo" : "—")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ImpostorPickView({
  sessionCode,
  participantId,
}: {
  sessionCode: string;
  participantId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<ImpostorViewState | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function fetchState() {
    const res = await fetch(
      `/api/sessions/${sessionCode}/impostor?participantId=${participantId}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setState(data);
  }

  useEffect(() => {
    fetchState().catch((err) =>
      setError(err instanceof Error ? err.message : "Erro ao carregar")
    );
    const interval = setInterval(() => {
      fetchState().catch(() => undefined);
    }, 5000);
    return () => clearInterval(interval);
  }, [sessionCode, participantId]);

  useEffect(() => {
    if (!state) return;

    if (state.roundStatus !== "open") {
      fetch(`/api/sessions/${sessionCode}?participantId=${participantId}`)
        .then((res) => res.json().then((session) => ({ res, session })))
        .then(({ res, session }) => {
          if (res.ok) {
            router.push(buildParticipantPath(sessionCode, session, participantId));
          }
        });
    }
  }, [state?.roundStatus, sessionCode, participantId, router, state]);

  async function handleConfirm() {
    if (!selectedCard) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/sessions/${sessionCode}/impostor/pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          playerId: selectedCard,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState(data);
      router.push(`/s/${sessionCode}/status`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar");
    } finally {
      setSubmitting(false);
    }
  }

  if (!state) {
    return (
      <p className="loading-pulse text-center text-on-pitch-muted">
        Carregando...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="card-pitch-header px-4 py-3">
          {state.isImpostor ? (
            <>
              <Badge variant="default" className="mb-2 border-red-400/40 text-red-300">
                Você é o impostor
              </Badge>
              <h3 className="font-display text-base">
                {state.themeTitle ?? "Complete a lista"}
              </h3>
              <p className="text-xs text-on-pitch-subtle">
                {state.themeTitle
                  ? "Rodada encerrada — este era o tema."
                  : "Você não vê o tema desta rodada. Escolha uma carta que encaixe na lista parcial."}
              </p>
            </>
          ) : (
            <>
              <h3 className="font-display text-base">{state.themeTitle}</h3>
              <p className="text-xs text-on-pitch-subtle">
                Rodada {state.roundNumber}/{state.totalRounds} · escolha o #
                {state.targetRank}
              </p>
            </>
          )}
        </div>
        <div className="p-4">
          <ListPreview
            picks={state.myPicks}
            targetRank={state.targetRank}
            highlightRank={selectedCard ? state.targetRank : undefined}
          />
        </div>
      </Card>

      {!state.hasConfirmed && (
        <div className="space-y-3">
          <h3 className="font-display text-lg text-off-white">
            Escolha 1 carta
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {state.cardOptions.map((card) => (
              <button
                key={card.playerId}
                type="button"
                onClick={() => setSelectedCard(card.playerId)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  selectedCard === card.playerId
                    ? "border-gold/50 bg-gold/10"
                    : "border-card-border bg-off-white-muted hover:border-gold/25"
                }`}
              >
                <p className="font-medium text-foreground">{card.playerName}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {card.position} · {card.nationality}
                </p>
              </button>
            ))}
          </div>

          <Button
            variant="gold"
            size="lg"
            className="w-full"
            disabled={!selectedCard || submitting}
            onClick={handleConfirm}
          >
            {submitting ? "Confirmando..." : "Confirmar escolha"}
          </Button>
        </div>
      )}

      {state.hasConfirmed && (
        <p className="text-center text-sm text-text-muted">
          Escolha confirmada. Aguardando os outros jogadores.
        </p>
      )}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
