"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionHeader } from "@/components/session-header";
import { StandingsTable } from "@/components/standings-table";
import { WinningListCard } from "@/components/winning-list-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGuestToken } from "@/lib/guest";
import {
  buildParticipantPath,
  getWaitingMessage,
} from "@/lib/session-info";
import type {
  CurrentRound,
  StandingEntry,
  WinningList,
} from "@/lib/types";

type SessionStatusData = {
  status: string;
  title: string;
  topN: number;
  currentRoundNumber: number;
  totalRounds: number;
  currentRound: CurrentRound | null;
  isCreator: boolean;
  standings: StandingEntry[];
  lastWinningList: WinningList | null;
  participants: {
    id: string;
    status: string;
    hasVoted?: boolean;
  }[];
  voteProgress: { voted: number; total: number };
  advanceAction: {
    canAdvance: boolean;
    label: string;
    redirect?: string;
  } | null;
};

export function SessionStatusView({
  code,
  participantId,
}: {
  code: string;
  participantId: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState<SessionStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState("");

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/sessions/${code}?participantId=${participantId}`
      );
      const data = await res.json();
      if (!res.ok) return;

      setSession(data);

      if (data.status === "setup") {
        router.replace(`/s/${code}`);
        return;
      }

      const targetPath = buildParticipantPath(code, data, participantId);
      if (!targetPath.endsWith("/status")) {
        router.replace(targetPath);
      }
    } finally {
      setLoading(false);
    }
  }, [code, participantId, router]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  async function handleAdvance() {
    if (!session?.advanceAction) return;
    setAdvancing(true);
    setAdvanceError("");

    try {
      const res = await fetch(`/api/sessions/${code}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const redirect = session.advanceAction?.redirect;
      if (redirect) {
        router.push(`/s/${code}${redirect}`);
      } else {
        await fetchSession();
      }
    } catch (err) {
      setAdvanceError(
        err instanceof Error ? err.message : "Erro ao avançar fase"
      );
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) {
    return (
      <p className="text-center text-off-white/70">Carregando...</p>
    );
  }

  if (!session) {
    return (
      <p className="text-center text-red-300">Sala não encontrada</p>
    );
  }

  const roundTitle =
    session.currentRound?.title ??
    session.lastWinningList?.roundTitle ??
    session.title;
  const stepLabel =
    session.currentRound?.status === "completed"
      ? `Rodada ${session.currentRoundNumber}/${session.totalRounds} encerrada`
      : `Rodada ${session.currentRoundNumber}/${session.totalRounds}`;
  const waitingMessage = getWaitingMessage(session, participantId);
  const advanceAction = session.advanceAction;

  return (
    <div className="space-y-5">
      <SessionHeader
        title={roundTitle}
        stepLabel={stepLabel}
        topN={session.topN}
        showCode={false}
      />

      <div className="rounded-xl bg-off-white/10 px-4 py-4 text-center text-sm text-off-white">
        {waitingMessage}
      </div>

      {session.standings.length > 0 && (
        <StandingsTable
          standings={session.standings}
          title="Classificação geral (pontos acumulados)"
        />
      )}

      {session.lastWinningList ? (
        <WinningListCard list={session.lastWinningList} />
      ) : (
        <Card className="px-4 py-6 text-center text-sm text-text-muted">
          A lista vitoriosa aparece após a primeira votação.
        </Card>
      )}

      {advanceError && (
        <p className="text-center text-sm text-red-400">{advanceError}</p>
      )}

      {session.isCreator && advanceAction && (
        <div className="flex justify-center">
          <Button
            variant="gold"
            size="lg"
            disabled={!advanceAction.canAdvance || advancing}
            onClick={handleAdvance}
            className="w-full sm:w-auto"
          >
            {advancing ? "Processando..." : advanceAction.label}
          </Button>
        </div>
      )}
    </div>
  );
}
