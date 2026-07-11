"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionHeader } from "@/components/session-header";
import { StandingsTable } from "@/components/standings-table";
import { MyRankingCard } from "@/components/my-ranking-card";
import { WinningListCard } from "@/components/winning-list-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGuestToken } from "@/lib/guest";
import {
  buildParticipantPath,
  getStatusViewMode,
  getWaitingMessage,
} from "@/lib/session-info";
import type { CurrentRound, StandingEntry, WinningList } from "@/lib/types";

type MyPicksData = {
  roundNumber: number;
  roundTitle: string;
  message?: string | null;
  picks: { rank: number; playerName: string }[];
};

type SessionStatusData = {
  status: string;
  title: string;
  topN: number;
  currentRoundNumber: number;
  totalRounds: number;
  currentRound: CurrentRound | null;
  isCreator: boolean;
  standings: StandingEntry[];
  lastRoundPoints?: Record<string, number>;
  lastWinningList?: WinningList | null;
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
  const [myPicks, setMyPicks] = useState<MyPicksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [sessionRes, picksRes] = await Promise.all([
        fetch(`/api/sessions/${code}?participantId=${participantId}`),
        fetch(`/api/sessions/${code}/picks?participantId=${participantId}`),
      ]);

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) return;

      setSession(sessionData);

      if (picksRes.ok) {
        const picksData = await picksRes.json();
        if (picksData.picks?.length > 0) {
          setMyPicks({
            roundNumber: picksData.roundNumber,
            roundTitle: picksData.roundTitle,
            message: picksData.message ?? null,
            picks: picksData.picks.map(
              (p: { rank: number; playerName: string }) => ({
                rank: p.rank,
                playerName: p.playerName,
              })
            ),
          });
        } else {
          setMyPicks(null);
        }
      }

      if (sessionData.status === "setup") {
        router.replace(`/s/${code}`);
        return;
      }

      const targetPath = buildParticipantPath(code, sessionData, participantId);
      if (!targetPath.endsWith("/status")) {
        router.replace(targetPath);
      }
    } finally {
      setLoading(false);
    }
  }, [code, participantId, router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

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
        await fetchData();
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
      <p className="loading-pulse text-center text-on-pitch-muted">Carregando...</p>
    );
  }

  if (!session) {
    return (
      <p className="text-center text-red-300">Sala não encontrada</p>
    );
  }

  const roundTitle =
    session.currentRound?.title ?? myPicks?.roundTitle ?? session.title;
  const stepLabel =
    session.currentRound?.status === "completed"
      ? `Rodada ${session.currentRoundNumber}/${session.totalRounds} encerrada`
      : `Rodada ${session.currentRoundNumber}/${session.totalRounds}`;
  const waitingMessage = getWaitingMessage(session, participantId);
  const advanceAction = session.advanceAction;
  const viewMode = getStatusViewMode(session, participantId);
  const isSpectator =
    session.participants.find((p) => p.id === participantId)?.status ===
    "spectator";

  return (
    <div className="space-y-5">
      <SessionHeader
        title={roundTitle}
        stepLabel={stepLabel}
        showCode={false}
      />

      <div className="waiting-pill px-5 py-3.5 text-center text-sm text-off-white/85">
        {waitingMessage}
      </div>

      {viewMode.showStandings && session.standings.length > 0 ? (
        <StandingsTable
          standings={session.standings}
          title="Classificação parcial"
          roundPointsByParticipant={
            session.currentRound?.status === "completed"
              ? session.lastRoundPoints
              : undefined
          }
        />
      ) : (
        session.currentRound?.status === "voting" && (
          <Card className="px-4 py-6 text-center text-sm text-text-muted">
            Classificação revelada quando o criador encerrar a rodada.
          </Card>
        )
      )}

      {viewMode.list === "winning" && session.lastWinningList ? (
        <WinningListCard list={session.lastWinningList} />
      ) : viewMode.list === "winning" ? (
        <Card className="px-4 py-6 text-center text-sm text-text-muted">
          Lista vitoriosa indisponível.
        </Card>
      ) : viewMode.list === "mine" && myPicks ? (
        <MyRankingCard
          roundNumber={myPicks.roundNumber}
          roundTitle={myPicks.roundTitle}
          message={myPicks.message}
          picks={myPicks.picks}
        />
      ) : !isSpectator && session.currentRound?.status !== "voting" ? (
        <Card className="px-4 py-6 text-center text-sm text-text-muted">
          Seu ranking aparece aqui após confirmar.
        </Card>
      ) : null}

      {isSpectator && session.currentRound?.status === "voting" && (
        <div className="flex justify-center">
          <Link href={`/s/${code}/vote`}>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Acompanhar votação
            </Button>
          </Link>
        </div>
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
