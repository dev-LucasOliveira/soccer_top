import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseFilters } from "@/lib/filters";
import { getCurrentRound, toCurrentRound, toRoundSummary } from "@/lib/round";
import { getStandings, getLastCompletedRoundResult } from "@/lib/session";
import { getPlayers } from "@/lib/participants";
import { getRoundWinningList } from "@/lib/round-result";
import { getAdvanceAction, getSessionPhase } from "@/lib/session-info";
import { getImpostorTheme } from "@/lib/impostor-themes";
import {
  IMPOSTOR_SESSION_DISPLAY_TITLE,
  isSessionImpostor,
  maskImpostorRoundTitle,
} from "@/lib/impostor-theme-access";
import { buildDueloViewState } from "@/lib/duelo-session";
import { buildListaSecretaMpViewState } from "@/lib/lista-secreta-mp-session";
import { processExpiredTurnIfNeeded } from "@/lib/pick-timeout";
import type {
  DueloSessionResult,
  GameMode,
  ListaSecretaMpSessionResult,
  SessionFinalResult,
  SessionResultData,
} from "@/lib/types";

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

    let session = await prisma.session.findUnique({
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

    if (viewerParticipantId) {
      const stillMember = session.participants.some(
        (participant) => participant.id === viewerParticipantId
      );
      if (!stillMember) {
        return NextResponse.json(
          { error: "Você foi removido desta sala", code: "removed" },
          { status: 403 }
        );
      }
    }

    if (
      session.status === "active" &&
      (session.gameMode === "duelo" || session.gameMode === "lista-secreta-mp")
    ) {
      await processExpiredTurnIfNeeded(code);
      const refreshedSession = await prisma.session.findUnique({
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
      if (refreshedSession) {
        session = refreshedSession;
      }
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

    const resultData =
      session.gameMode === "impostor" && session.result
        ? (JSON.parse(session.result.data) as import("@/lib/types").ImpostorSessionResult)
        : session.gameMode === "duelo" && session.result
          ? (JSON.parse(session.result.data) as DueloSessionResult)
          : session.gameMode === "lista-secreta-mp" && session.result
            ? (JSON.parse(session.result.data) as ListaSecretaMpSessionResult)
            : normalizeSessionResult(
                session.result ? JSON.parse(session.result.data) : null,
                session.participants
              );

    const configuredTotalRounds =
      session.gameMode === "lista-secreta-mp"
        ? session.listaSecretaTotalRounds
        : session.gameMode === "duelo"
          ? session.umSoTotalRounds
          : null;

    const showPicks =
      session.gameMode !== "impostor" &&
      (session.status === "completed" ||
        (session.status === "active" && currentRound?.status === "open"));

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

    const viewerIsImpostor = isSessionImpostor(
      session.gameMode,
      session.impostorParticipantId,
      viewerParticipantId
    );

    const maskedRounds =
      session.gameMode === "impostor"
        ? session.rounds.map((round) => ({
            ...toRoundSummary(round),
            title: maskImpostorRoundTitle(round, viewerIsImpostor),
          }))
        : session.rounds.map(toRoundSummary);

    const maskedCurrentRound =
      currentRound && session.gameMode === "impostor"
        ? {
            ...currentRound,
            title: maskImpostorRoundTitle(
              {
                number: currentRound.number,
                title: currentRound.title,
                status: currentRound.status,
              },
              viewerIsImpostor
            ),
          }
        : currentRound;

    const displayTitle =
      session.gameMode === "impostor" && session.status === "active"
        ? viewerIsImpostor
          ? IMPOSTOR_SESSION_DISPLAY_TITLE
          : (maskedCurrentRound?.title ?? IMPOSTOR_SESSION_DISPLAY_TITLE)
        : session.title;

    const standings = await getStandings(code);

    const playerCount = getPlayers(session.participants).length;

    const sessionPayload = {
      id: session.id,
      code: session.code,
      title: displayTitle,
      gameMode: session.gameMode as GameMode,
      status: session.status,
      currentRoundNumber: session.currentRoundNumber,
      totalRounds: configuredTotalRounds ?? session.rounds.length,
      createdAt: session.createdAt,
      creatorParticipantId: session.creatorParticipantId,
      impostorThemeId: viewerIsImpostor ? null : session.impostorThemeId,
      impostorTheme:
        viewerIsImpostor || !session.impostorThemeId
          ? null
          : getImpostorTheme(session.impostorThemeId),
      impostorThemeSelected: Boolean(session.impostorThemeId),
      isImpostor: viewerIsImpostor,
      umSoTotalRounds: session.umSoTotalRounds,
      listaSecretaTotalRounds: session.listaSecretaTotalRounds,
      listaSecretaSlotCount: session.listaSecretaSlotCount,
      pickTimeLimitSeconds: session.pickTimeLimitSeconds,
      isCreator,
      rounds: maskedRounds,
      currentRound: maskedCurrentRound,
      voteProgress: {
        voted: roundVotes.length,
        total: playerCount,
      },
      standings,
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

    const dueloView =
      session.gameMode === "duelo"
        ? buildDueloViewState(session, viewerParticipantId)
        : null;

    const listaSecretaMpView =
      session.gameMode === "lista-secreta-mp"
        ? buildListaSecretaMpViewState(session, viewerParticipantId)
        : null;

    const phase = getSessionPhase({
      gameMode: session.gameMode as GameMode,
      status: session.status,
      currentRoundNumber: session.currentRoundNumber,
      totalRounds: configuredTotalRounds ?? session.rounds.length,
      currentRound,
      participants: session.participants,
      voteProgress: sessionPayload.voteProgress,
      rounds: session.rounds,
      impostorThemeSelected: Boolean(session.impostorThemeId),
      umSoTotalRounds: session.umSoTotalRounds,
      listaSecretaTotalRounds: session.listaSecretaTotalRounds,
      listaSecretaSlotCount: session.listaSecretaSlotCount,
    });

    const advanceAction = getAdvanceAction({
      ...sessionPayload,
      isCreator,
      rounds: session.rounds,
      impostorThemeSelected: Boolean(session.impostorThemeId),
      umSoTotalRounds: session.umSoTotalRounds,
      listaSecretaTotalRounds: session.listaSecretaTotalRounds,
      listaSecretaSlotCount: session.listaSecretaSlotCount,
    });

    const lastCompletedRound =
      currentRound?.status === "completed"
        ? await getLastCompletedRoundResult(code)
        : null;

    const lastWinningList = lastCompletedRound
      ? getRoundWinningList({
          ...lastCompletedRound.data,
          roundNumber: lastCompletedRound.roundNumber,
          roundTitle: lastCompletedRound.roundTitle,
        })
      : null;

    const lastRoundPoints = lastCompletedRound?.data.pointsByParticipant;

    return NextResponse.json({
      ...sessionPayload,
      phase,
      advanceAction,
      dueloView,
      listaSecretaMpView,
      filters: currentRound?.filters ?? {},
      topN: currentRound?.topN ?? 10,
      lastWinningList,
      lastRoundPoints,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar sala" },
      { status: 500 }
    );
  }
}
