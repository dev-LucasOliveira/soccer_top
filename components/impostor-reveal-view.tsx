"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildParticipantPath } from "@/lib/session-info";
import { ImpostorPhaseControls } from "@/components/impostor-phase-controls";
import type { ImpostorViewState } from "@/lib/types";

export function ImpostorRevealView({
  sessionCode,
  participantId,
}: {
  sessionCode: string;
  participantId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<ImpostorViewState | null>(null);
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
    if (state.roundStatus !== "reveal") {
      fetch(`/api/sessions/${sessionCode}?participantId=${participantId}`)
        .then((res) => res.json().then((session) => ({ res, session })))
        .then(({ res, session }) => {
          if (res.ok) {
            router.push(buildParticipantPath(sessionCode, session, participantId));
          }
        });
    }
  }, [state?.roundStatus, sessionCode, participantId, router, state]);

  if (!state) {
    return (
      <p className="loading-pulse text-center text-on-pitch-muted">
        Carregando...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        {state.isImpostor ? (
          <>
            <Badge variant="default" className="mb-2 border-red-400/40 text-red-300">
              Você é o impostor
            </Badge>
            <h2 className="font-display text-lg text-foreground">
              {state.themeTitle ?? "Debate — complete o papo"}
            </h2>
            {!state.themeTitle && (
              <p className="mt-2 text-sm text-text-muted">
                Blefe com naturalidade. O tema só aparece para você depois que a
                rodada encerrar.
              </p>
            )}
          </>
        ) : (
          <h2 className="font-display text-lg text-foreground">{state.themeTitle}</h2>
        )}
        <p className="mt-2 text-sm text-text-muted">
          Rodada {state.roundNumber}/{state.totalRounds}. Comparem as escolhas,
          discutam quem errou no #3 e, quando estiverem prontos, o criador abre
          a votação.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {state.participantLists.map((participant) => (
          <Card key={participant.participantId} className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
              <h3 className="font-bold text-foreground">
                {participant.displayName}
              </h3>
              {participant.status === "spectator" && (
                <Badge variant="default">Eliminado</Badge>
              )}
            </div>
            <div className="space-y-1.5 p-4">
              {participant.picks.map((pick) => (
                <div
                  key={pick.rank}
                  className="flex items-center gap-3 rounded-lg bg-off-white-muted px-3 py-2"
                >
                  <span className="rank-badge-card flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {pick.rank}
                  </span>
                  <span className="font-medium text-foreground">
                    {pick.playerName}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <ImpostorPhaseControls
        sessionCode={sessionCode}
        participantId={participantId}
        expectedRoundStatus="reveal"
        creatorHint="Quando o debate terminar, abra a votação para todos escolherem quem eliminar."
        waitingHint="Debatam com calma. O criador abre a votação quando vocês estiverem prontos."
      />

      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
