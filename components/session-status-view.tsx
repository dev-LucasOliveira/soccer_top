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
import { AbortSessionButton } from "@/components/abort-session-button";
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
  gameMode?: "ranking" | "impostor";
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
      if (!sessionData.isCreator && !targetPath.endsWith("/status")) {
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

      const sessionRes = await fetch(
        `/api/sessions/${code}?participantId=${participantId}`
      );
      const sessionData = await sessionRes.json();
      if (sessionRes.ok) {
        router.push(buildParticipantPath(code, sessionData, participantId));
        return;
      }

      await fetchData();
    } catch (err) {
      setAdvanceError(
        err instanceof Error ? err.message : "Erro ao avançar fase"
      );
      await fetchData();
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

      {viewMode.showStandings &&
      session.gameMode !== "impostor" &&
      session.standings.length > 0 ? (
        <StandingsTable
          standings={session.standings}
          title="Classificação parcial"
          roundPointsByParticipant={
            session.currentRound?.status === "completed"
              ? session.lastRoundPoints
              : undefined
          }
        />
      ) : session.gameMode === "impostor" &&
        session.currentRound?.status === "reveal" ? (
        <Card className="px-4 py-6 text-center">
          <p className="mb-4 text-sm text-text-muted">
            Veja as listas de todos e debata antes da votação.
          </p>
          <Link href={`/s/${code}/reveal`}>
            <Button variant="secondary" size="lg">
              Ir para o debate
            </Button>
          </Link>
        </Card>
      ) : session.currentRound?.status === "voting" ? (
        <Card className="px-4 py-6 text-center">
          <p className="mb-4 text-sm text-text-muted">
            {session.gameMode === "impostor"
              ? "Vote em quem você acha que é o impostor."
              : "Resultado revelado quando o criador encerrar a rodada."}
          </p>
          {session.gameMode === "impostor" &&
            !isSpectator &&
            !session.participants.find((p) => p.id === participantId)
              ?.hasVoted && (
              <Link href={`/s/${code}/vote`}>
                <Button size="lg">Ir votar</Button>
              </Link>
            )}
        </Card>
      ) : null}

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
          {session.gameMode === "impostor"
            ? "Sua lista aparece aqui após escolher a carta."
            : "Seu ranking aparece aqui após confirmar."}
        </Card>
      ) : null}

      {isSpectator && session.currentRound?.status === "voting" && (
        <div className="flex justify-center">
          <Link href={`/s/${code}/vote`}>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              {session.gameMode === "impostor"
                ? "Acompanhar eliminação"
                : "Acompanhar votação"}
            </Button>
          </Link>
        </div>
      )}

      {isSpectator && session.gameMode === "impostor" && session.currentRound?.status === "reveal" && (
        <div className="flex justify-center">
          <Link href={`/s/${code}/reveal`}>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Acompanhar debate
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

      {session.isCreator && session.status === "active" && (
        <div className="flex justify-center">
          <AbortSessionButton
            sessionCode={code}
            participantId={participantId}
            size="sm"
          />
        </div>
      )}
    </div>
  );
}
