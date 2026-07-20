"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildParticipantPath } from "@/lib/session-info";
import { ImpostorPhaseControls } from "@/components/impostor-phase-controls";
import type { ImpostorVoteState } from "@/lib/types";

export function ImpostorVoteView({
  sessionCode,
  participantId,
}: {
  sessionCode: string;
  participantId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<ImpostorVoteState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function fetchState() {
    const res = await fetch(
      `/api/sessions/${sessionCode}/vote?participantId=${participantId}`
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
    if (state?.hasVoted && !state.isSpectator) {
      router.push(`/s/${sessionCode}/status`);
    }
  }, [state?.hasVoted, state?.isSpectator, sessionCode, router, state]);

  async function handleVote(targetParticipantId: string) {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/sessions/${sessionCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          targetParticipantId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState(data);
      router.push(`/s/${sessionCode}/status`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao votar");
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

  if (state.isSpectator) {
    return (
      <Card className="p-5 text-center">
        <p className="text-sm text-text-muted">
          Você foi eliminado e está assistindo a votação (
          {state.votedCount}/{state.totalVoters} votos).
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {state.isImpostor && (
        <Badge variant="default" className="border-red-400/40 text-red-300">
          Você é o impostor — vote em quem a tripulação pode suspeitar de você
        </Badge>
      )}

      <Card className="p-4">
        <h2 className="font-display text-lg text-foreground">
          Quem é o impostor?
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Toque no jogador que vocês querem eliminar. O mais votado sai da
          rodada.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Rodada {state.roundNumber} · {state.votedCount}/{state.totalVoters}{" "}
          votos registrados
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {state.participants
          .filter((participant) => participant.id !== participantId)
          .map((participant) => (
          <Button
            key={participant.id}
            variant="secondary"
            size="lg"
            className="h-auto justify-start px-4 py-4"
            disabled={submitting || state.hasVoted}
            onClick={() => handleVote(participant.id)}
          >
            <span className="font-semibold">{participant.displayName}</span>
          </Button>
        ))}
      </div>

      {state.hasVoted && (
        <p className="text-center text-sm text-text-muted">
          Voto registrado. Aguardando os outros jogadores.
        </p>
      )}

      <ImpostorPhaseControls
        sessionCode={sessionCode}
        participantId={participantId}
        expectedRoundStatus="voting"
        creatorHint="Quando todos votarem, encerre a rodada para aplicar a eliminação."
        waitingHint={
          state.hasVoted
            ? "Você já votou. Aguardando os outros ou o criador encerrar a rodada."
            : undefined
        }
      />

      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
