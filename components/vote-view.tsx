"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatListLabel } from "@/lib/voting";
import { buildParticipantPath } from "@/lib/session-info";
import { ListMessage } from "@/components/list-message";
import type { VoteState } from "@/lib/types";

export function VoteView({
  sessionCode,
  participantId,
}: {
  sessionCode: string;
  participantId: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<VoteState | null>(null);
  const [selectedAlias, setSelectedAlias] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const fetchVoteState = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/sessions/${sessionCode}/vote?participantId=${participantId}`
      );
      const data = await res.json();
      if (!res.ok) {
        const sessionRes = await fetch(
          `/api/sessions/${sessionCode}?participantId=${participantId}`
        );
        const sessionData = await sessionRes.json();
        if (sessionRes.ok) {
          const targetPath = buildParticipantPath(
            sessionCode,
            sessionData,
            participantId
          );
          if (!targetPath.endsWith("/vote")) {
            router.replace(targetPath);
            return;
          }
        }
        throw new Error(data.error);
      }
      setState(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar votação");
    } finally {
      setLoading(false);
    }
  }, [sessionCode, participantId, router]);

  useEffect(() => {
    fetchVoteState();
    const interval = setInterval(fetchVoteState, 5000);
    return () => clearInterval(interval);
  }, [fetchVoteState]);

  useEffect(() => {
    if (state?.hasVoted) {
      setSelectedAlias(state.votedAlias);
    }
  }, [state?.hasVoted, state?.votedAlias]);

  async function confirmVote() {
    if (!selectedAlias) return;

    setConfirming(true);
    setError("");

    try {
      const res = await fetch(`/api/sessions/${sessionCode}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, alias: selectedAlias }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/s/${sessionCode}/status`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao votar");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <p className="loading-pulse text-center text-on-pitch-muted">
        Carregando votação...
      </p>
    );
  }

  if (error && !state) {
    return <p className="text-center text-red-300">{error}</p>;
  }

  if (!state) return null;

  const isSpectator = state.isSpectator === true;
  const highlightAlias = state.hasVoted ? state.votedAlias : selectedAlias;

  return (
    <div className={`space-y-5 ${!isSpectator && !state.hasVoted ? "pb-24" : ""}`}>
      <div className="text-center">
        <p className="text-sm text-on-pitch-muted">
          {isSpectator
            ? "Modo espectador — acompanhe as listas e os votos"
            : "Escolha o melhor ranking — os autores são revelados só no final"}
        </p>
        <Badge variant="gold" className="mt-3">
          {state.votedCount}/{state.totalVoters} votaram
        </Badge>
      </div>

      {isSpectator && (
        <div className="waiting-pill px-5 py-3 text-center text-sm text-off-white/85">
          Modo espectador — só assistindo.
        </div>
      )}

      {state.hasVoted && !isSpectator && (
        <div className="waiting-pill px-5 py-3 text-center text-sm text-off-white/85">
          Você votou em{" "}
          <strong className="text-gold-light">
            {formatListLabel(state.votedAlias ?? "")}
          </strong>
          . Aguardando o criador encerrar a votação.
        </div>
      )}

      {error && <p className="text-center text-sm text-red-300">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {state.lists.map((list) => {
          const isMine = list.alias === state.myAlias;
          const isSelected = highlightAlias === list.alias;

          return (
            <Card
              key={list.alias}
              className={`overflow-hidden p-0 transition-all duration-200 ${
                isMine ? "opacity-60" : ""
              } ${isSelected ? "ring-1 ring-gold/70 shadow-md shadow-gold/10" : ""}`}
            >
              <div className="flex items-center justify-between bg-pitch/95 px-4 py-3 text-off-white">
                <div>
                  <h3 className="font-bold">{formatListLabel(list.alias)}</h3>
                  {isMine && (
                    <p className="text-xs text-on-pitch-subtle">Seu ranking</p>
                  )}
                </div>
                <Badge variant="gold">{list.voteCount} votos</Badge>
              </div>
              <ListMessage message={list.message} />
              <div className="space-y-1.5 p-4">
                {list.picks.map((pick) => (
                  <div
                    key={pick.rank}
                    className="flex items-center gap-3 rounded-lg bg-off-white-muted px-3 py-2"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pitch text-xs font-bold text-off-white">
                      {pick.rank}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">
                        {pick.playerName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {pick.position} · {pick.nationality}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {!isSpectator && !isMine && !state.hasVoted && (
                <div className="border-t border-card-border p-4">
                  <Button
                    className="w-full"
                    variant={selectedAlias === list.alias ? "primary" : "secondary"}
                    onClick={() => setSelectedAlias(list.alias)}
                  >
                    {selectedAlias === list.alias
                      ? "Selecionada"
                      : "Selecionar esta lista"}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {!isSpectator && !state.hasVoted && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-off-white/8 bg-pitch-dark/90 px-4 py-4 backdrop-blur-md">
          <div className="mx-auto max-w-4xl">
            <Button
              className="w-full"
              disabled={confirming || !selectedAlias}
              onClick={confirmVote}
            >
              {confirming
                ? "Confirmando..."
                : selectedAlias
                  ? `Confirmar voto em ${formatListLabel(selectedAlias)}`
                  : "Selecione uma lista para votar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
