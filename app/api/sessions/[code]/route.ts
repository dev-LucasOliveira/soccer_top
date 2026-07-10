import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseFilters } from "@/lib/filters";
import { getCurrentRound, toCurrentRound, toRoundSummary } from "@/lib/round";
import { getLastWinningList, getStandings } from "@/lib/session";
import {
  getAdvanceAction,
  getSessionPhase,
} from "@/lib/session-info";
import type { SessionFinalResult, SessionResultData } from "@/lib/types";

function normalizeSessionResult(
  raw: SessionResultData | SessionFinalResult | null,
  participants: { id: string; displayName: string }[]
): SessionFinalResult | null {
  if (!raw) return null;
  if ("standings" in raw && "rounds" in raw) {
    return raw as SessionFinalResult;
  }

  const legacy = raw as SessionResultData;
  const standings = legacy.voteRanking.map((entry, index) => ({
    participantId: entry.participantId,
    displayName: entry.displayName,
    totalPoints: entry.voteCount,
    rank: index + 1,
  }));

  return {
    standings,
    roundSummaries: [
      {
        roundNumber: 1,
        title: "Rodada 1",
        pointsByParticipant: Object.fromEntries(
          legacy.voteRanking.map((e) => [e.participantId, e.voteCount])
        ),
      },
    ],
    rounds: {
      1: {
        ...legacy,
        pointsByParticipant: Object.fromEntries(
          legacy.voteRanking.map((e) => [e.participantId, e.voteCount])
        ),
        roundNumber: 1,
        roundTitle: "Rodada 1",
      },
    },
  };
}

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const { searchParams } = new URL(request.url);
    const viewerParticipantId = searchParams.get("participantId");

    const session = await prisma.session.findUnique({
      where: { code },
      include: {
        participants: {
          orderBy: { joinedAt: "asc" },
        },
        rounds: {
          orderBy: { number: "asc" },
        },
        result: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
    }

    const currentRoundRecord = getCurrentRound(session);
    const currentRound = currentRoundRecord
      ? toCurrentRound(currentRoundRecord)
      : null;

    let roundVotes: { voterParticipantId: string }[] = [];
    let roundPicks: {
      participantId: string;
      rank: number;
      playerId: string;
      player: { name: string; primaryPosition: string; nationality: string };
    }[] = [];

    if (currentRoundRecord) {
      const roundData = await prisma.round.findUnique({
        where: { id: currentRoundRecord.id },
        include: {
          votes: true,
          picks: {
            include: { player: true },
            orderBy: { rank: "asc" },
          },
        },
      });
      if (roundData) {
        roundVotes = roundData.votes;
        roundPicks = roundData.picks;
      }
    }

    const resultData = normalizeSessionResult(
      session.result ? JSON.parse(session.result.data) : null,
      session.participants
    );

    const showPicks =
      session.status === "completed" ||
      (session.status === "active" && currentRound?.status === "open");

    const votedParticipantIds = new Set(
      roundVotes.map((v) => v.voterParticipantId)
    );

    const picksByParticipant = new Map<string, typeof roundPicks>();
    for (const pick of roundPicks) {
      const list = picksByParticipant.get(pick.participantId) ?? [];
      list.push(pick);
      picksByParticipant.set(pick.participantId, list);
    }

    const isCreator =
      viewerParticipantId != null &&
      viewerParticipantId === session.creatorParticipantId;

    const [standings, lastWinningList] = await Promise.all([
      getStandings(code),
      getLastWinningList(code),
    ]);

    const sessionPayload = {
      id: session.id,
      code: session.code,
      title: session.title,
      status: session.status,
      currentRoundNumber: session.currentRoundNumber,
      totalRounds: session.rounds.length,
      createdAt: session.createdAt,
      creatorParticipantId: session.creatorParticipantId,
      isCreator,
      rounds: session.rounds.map(toRoundSummary),
      currentRound,
      voteProgress: {
        voted: roundVotes.length,
        total: session.participants.length,
      },
      standings,
      lastWinningList,
      participants: session.participants.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        status: p.status,
        joinedAt: p.joinedAt,
        confirmedAt: p.confirmedAt,
        pickCount: (picksByParticipant.get(p.id) ?? []).length,
        hasVoted: votedParticipantIds.has(p.id),
        picks:
          showPicks &&
          (session.status === "completed" || p.status === "confirmed")
            ? (picksByParticipant.get(p.id) ?? []).map((pick) => ({
                rank: pick.rank,
                playerId: pick.playerId,
                playerName: pick.player.name,
                position: pick.player.primaryPosition,
                nationality: pick.player.nationality,
              }))
            : [],
      })),
      result: resultData,
    };

    const phase = getSessionPhase({
      status: session.status,
      currentRoundNumber: session.currentRoundNumber,
      totalRounds: session.rounds.length,
      currentRound,
      participants: session.participants,
      voteProgress: sessionPayload.voteProgress,
      rounds: session.rounds,
    });

    const advanceAction = getAdvanceAction({
      ...sessionPayload,
      isCreator,
      rounds: session.rounds,
    });

    return NextResponse.json({
      ...sessionPayload,
      phase,
      advanceAction,
      filters: currentRound?.filters ?? {},
      topN: currentRound?.topN ?? 10,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar sala" },
      { status: 500 }
    );
  }
}
