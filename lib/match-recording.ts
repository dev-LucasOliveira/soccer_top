import { prisma } from "@/lib/db";
import {
  LEADERBOARD_MODES,
  STATS_GAME_MODES,
  type StatsGameMode,
} from "@/lib/stats-game-modes";
import type {
  DueloSessionResult,
  ImpostorSessionResult,
  ListaSecretaMpSessionResult,
  SessionFinalResult,
} from "@/lib/types";

export { LEADERBOARD_MODES, STATS_GAME_MODES, type StatsGameMode };

export type MatchRecordInput = {
  userId: string;
  gameMode: string;
  sessionId?: string | null;
  score: number;
  placement?: number | null;
  metadata?: Record<string, unknown>;
  won?: boolean;
};

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function updateUserModeStats(
  tx: TxClient,
  entry: MatchRecordInput
) {
  const won = entry.won ?? entry.placement === 1;

  const existing = await tx.userModeStats.findUnique({
    where: {
      userId_gameMode: { userId: entry.userId, gameMode: entry.gameMode },
    },
  });

  const gamesPlayed = (existing?.gamesPlayed ?? 0) + 1;
  const wins = (existing?.wins ?? 0) + (won ? 1 : 0);
  const totalScore = (existing?.totalScore ?? 0) + entry.score;
  const bestScore =
    existing?.bestScore != null
      ? Math.max(existing.bestScore, entry.score)
      : entry.score;

  await tx.userModeStats.upsert({
    where: {
      userId_gameMode: { userId: entry.userId, gameMode: entry.gameMode },
    },
    create: {
      userId: entry.userId,
      gameMode: entry.gameMode,
      gamesPlayed,
      wins,
      totalScore,
      bestScore,
    },
    update: {
      gamesPlayed,
      wins,
      totalScore,
      bestScore,
    },
  });
}

export async function recordMatchForParticipants(entries: MatchRecordInput[]) {
  const validEntries = entries.filter((entry) => entry.userId);
  if (validEntries.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const entry of validEntries) {
      await tx.matchRecord.create({
        data: {
          userId: entry.userId,
          gameMode: entry.gameMode,
          sessionId: entry.sessionId ?? null,
          score: entry.score,
          placement: entry.placement ?? null,
          metadata: JSON.stringify(entry.metadata ?? {}),
        },
      });

      await updateUserModeStats(tx, entry);
    }
  });
}

export async function recordRankingSessionMatch(
  sessionId: string,
  result: SessionFinalResult
) {
  const participants = await prisma.participant.findMany({
    where: { sessionId, userId: { not: null } },
    select: { id: true, userId: true },
  });

  if (participants.length === 0) return;

  const byId = new Map(participants.map((p) => [p.id, p.userId!]));
  const entries: MatchRecordInput[] = [];

  for (const standing of result.standings) {
    const userId = byId.get(standing.participantId);
    if (!userId) continue;
    entries.push({
      userId,
      gameMode: STATS_GAME_MODES.RANKING,
      sessionId,
      score: standing.totalPoints,
      placement: standing.rank,
      won: standing.rank === 1,
    });
  }

  await recordMatchForParticipants(entries);
}

export async function recordImpostorSessionMatch(
  sessionId: string,
  result: ImpostorSessionResult
) {
  const participants = await prisma.participant.findMany({
    where: { sessionId, userId: { not: null } },
    select: { id: true, userId: true },
  });

  if (participants.length === 0) return;

  const impostorId = result.impostorParticipantId;
  const crewWin = result.outcome === "crew_win";

  const entries: MatchRecordInput[] = participants.map((participant) => {
    const isImpostor = participant.id === impostorId;
    const won = crewWin ? !isImpostor : isImpostor;
    return {
      userId: participant.userId!,
      gameMode: STATS_GAME_MODES.IMPOSTOR,
      sessionId,
      score: won ? 100 : 0,
      placement: won ? 1 : 2,
      won,
      metadata: { outcome: result.outcome, isImpostor },
    };
  });

  await recordMatchForParticipants(entries);
}

export async function recordDueloSessionMatch(
  sessionId: string,
  result: DueloSessionResult
) {
  const participants = await prisma.participant.findMany({
    where: { sessionId, userId: { not: null } },
    select: { id: true, userId: true },
  });

  if (participants.length === 0) return;

  const byId = new Map(participants.map((p) => [p.id, p.userId!]));
  const entries: MatchRecordInput[] = [];

  for (const standing of result.standings) {
    const userId = byId.get(standing.participantId);
    if (!userId) continue;
    entries.push({
      userId,
      gameMode: STATS_GAME_MODES.DUELO,
      sessionId,
      score: standing.totalPoints,
      placement: standing.rank,
      won: standing.rank === 1 && result.outcome === "completed",
      metadata: { outcome: result.outcome, roundsWon: standing.roundsWon },
    });
  }

  await recordMatchForParticipants(entries);
}

export async function recordListaSecretaMpSessionMatch(
  sessionId: string,
  result: ListaSecretaMpSessionResult
) {
  const participants = await prisma.participant.findMany({
    where: { sessionId, userId: { not: null } },
    select: { id: true, userId: true },
  });

  if (participants.length === 0) return;

  const byId = new Map(participants.map((p) => [p.id, p.userId!]));
  const entries: MatchRecordInput[] = [];

  for (const standing of result.standings) {
    const userId = byId.get(standing.participantId);
    if (!userId) continue;
    entries.push({
      userId,
      gameMode: STATS_GAME_MODES.LISTA_SECRETA_MP,
      sessionId,
      score: standing.totalSlots,
      placement: standing.rank,
      won: standing.rank === 1,
      metadata: {
        roundsWon: standing.roundsWon,
        totalSlots: standing.totalSlots,
      },
    });
  }

  await recordMatchForParticipants(entries);
}

export async function recordSoloGuessTopMatch(
  userId: string,
  data: {
    topsCompleted: number;
    errorsUsed: number;
    reason: string;
  }
) {
  await recordMatchForParticipants([
    {
      userId,
      gameMode: STATS_GAME_MODES.GUESS_TOP,
      score: data.topsCompleted,
      metadata: {
        errorsUsed: data.errorsUsed,
        reason: data.reason,
      },
    },
  ]);
}

export async function recordSoloUmSoMatch(
  userId: string,
  data: {
    score: number;
    bestStreak: number;
    roundsCompleted: number;
    reason: string;
  }
) {
  await recordMatchForParticipants([
    {
      userId,
      gameMode: STATS_GAME_MODES.UM_SO,
      score: data.score,
      metadata: {
        bestStreak: data.bestStreak,
        roundsCompleted: data.roundsCompleted,
        reason: data.reason,
      },
    },
  ]);
}

export async function safeRecordMatch(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (error) {
    console.error("Failed to record match:", error);
  }
}
