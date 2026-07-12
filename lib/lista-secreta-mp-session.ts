import { prisma } from "@/lib/db";
import { assertCreator } from "@/lib/creator-auth";
import { parseFilters } from "@/lib/filters";
import { getPlayers } from "@/lib/participants";
import { getCurrentRound } from "@/lib/round";
import { GUESS_TOP_CHALLENGES } from "@/lib/guess-top-challenges";
import { shouldShowMetaHint } from "@/lib/guess-top-hints";
import {
  DEFAULT_LSMP_ROUNDS,
  DEFAULT_LSMP_SLOT_COUNT,
  MAX_LSMP_ROUNDS,
  MAX_LSMP_SLOT_COUNT,
  MIN_LSMP_PLAYERS,
  MIN_LSMP_ROUNDS,
  MIN_LSMP_SLOT_COUNT,
} from "@/lib/lista-secreta-mp-constants";
import {
  drawRoundFromChallengeWithCount,
  getResolvedChallengeById,
} from "@/lib/guess-top-score";
import type {
  ListaSecretaMpPublicSlot,
  ListaSecretaMpRoundPayload,
  ListaSecretaMpRoundRecap,
  ListaSecretaMpSessionResult,
  ListaSecretaMpSlotPayload,
  ListaSecretaMpStandingEntry,
  ListaSecretaMpViewState,
} from "@/lib/types";

export {
  MIN_LSMP_PLAYERS,
  DEFAULT_LSMP_ROUNDS,
  MIN_LSMP_ROUNDS,
  MAX_LSMP_ROUNDS,
  DEFAULT_LSMP_SLOT_COUNT,
  MIN_LSMP_SLOT_COUNT,
  MAX_LSMP_SLOT_COUNT,
};

type SessionFull = Awaited<ReturnType<typeof getSessionOrThrow>>;

async function getSessionOrThrow(sessionCode: string) {
  const session = await prisma.session.findUnique({
    where: { code: sessionCode },
    include: {
      participants: { orderBy: { joinedAt: "asc" } },
      rounds: { orderBy: { number: "asc" } },
      result: true,
    },
  });

  if (!session) {
    throw new Error("Sala não encontrada");
  }

  return session;
}

function pickRandomChallengeId(): string {
  const idx = Math.floor(Math.random() * GUESS_TOP_CHALLENGES.length);
  return GUESS_TOP_CHALLENGES[idx]!.id;
}

export function parseListaSecretaMpPayload(
  raw: string | null | undefined
): ListaSecretaMpRoundPayload | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ListaSecretaMpRoundPayload;
  } catch {
    return null;
  }
}

function serializePayload(payload: ListaSecretaMpRoundPayload): string {
  return JSON.stringify(payload);
}

function getLsmpPlayers(session: SessionFull) {
  const players = getPlayers(session.participants);
  if (players.length !== MIN_LSMP_PLAYERS) {
    throw new Error("O modo precisa de exatamente 2 jogadores");
  }
  return players;
}

function firstPlayerForRound(session: SessionFull, roundNumber: number): string {
  const players = getLsmpPlayers(session);
  const hostId = session.creatorParticipantId ?? players[0]!.id;
  const guestId = players.find((p) => p.id !== hostId)?.id ?? players[1]!.id;
  return roundNumber % 2 === 1 ? hostId : guestId;
}

function otherParticipant(
  playerOrder: [string, string],
  participantId: string
): string {
  return playerOrder[0] === participantId ? playerOrder[1] : playerOrder[0];
}

function buildSlotsFromDraw(
  challenge: Awaited<ReturnType<typeof getResolvedChallengeById>>,
  drawnPlayerIds: string[]
): ListaSecretaMpSlotPayload[] {
  if (!challenge) throw new Error("Desafio não encontrado");

  const byId = new Map(challenge.pool.map((player) => [player.playerId, player]));
  const showMetaHint = shouldShowMetaHint(challenge.searchFilters);

  return drawnPlayerIds.map((playerId, index) => {
    const player = byId.get(playerId);
    if (!player) {
      throw new Error(`Jogador sorteado inválido: ${playerId}`);
    }

    return {
      slotIndex: index + 1,
      secretPlayerId: player.playerId,
      hintLabel: player.hint.label,
      nationality: player.nationality,
      position: player.position,
      showMetaHint,
    };
  });
}

function initialSlotWins(playerOrder: [string, string]): Record<string, number> {
  return {
    [playerOrder[0]]: 0,
    [playerOrder[1]]: 0,
  };
}

function resolveRoundWinner(
  slotWins: Record<string, number>,
  playerOrder: [string, string]
): { winnerParticipantId?: string; tied: boolean } {
  const [a, b] = playerOrder;
  const winsA = slotWins[a] ?? 0;
  const winsB = slotWins[b] ?? 0;

  if (winsA === winsB) {
    return { tied: true };
  }

  return {
    winnerParticipantId: winsA > winsB ? a : b,
    tied: false,
  };
}

function participantColor(
  participantId: string,
  playerOrder: [string, string]
): "host" | "guest" {
  return participantId === playerOrder[0] ? "host" : "guest";
}

function toPublicSlots(
  payload: ListaSecretaMpRoundPayload,
  participants: { id: string; displayName: string }[]
): ListaSecretaMpPublicSlot[] {
  return payload.slots.map((slot) => {
    const publicSlot: ListaSecretaMpPublicSlot = {
      slotIndex: slot.slotIndex,
      hintLabel: slot.hintLabel,
      nationality: slot.nationality,
      position: slot.position,
      showMetaHint: slot.showMetaHint,
    };

    if (slot.revealedByParticipantId && slot.playerName) {
      const revealer = participants.find(
        (p) => p.id === slot.revealedByParticipantId
      );
      publicSlot.revealed = {
        playerName: slot.playerName,
        hintLabel: slot.hintLabel,
        nationality: slot.nationality,
        position: slot.position,
        revealedByParticipantId: slot.revealedByParticipantId,
        revealedByDisplayName: revealer?.displayName ?? "",
        ownerColor: participantColor(
          slot.revealedByParticipantId,
          payload.playerOrder
        ),
      };
    }

    return publicSlot;
  });
}

async function createRoundPayload(
  session: SessionFull,
  roundNumber: number
): Promise<{
  title: string;
  filters: string;
  payload: ListaSecretaMpRoundPayload;
}> {
  const players = getLsmpPlayers(session);
  const slotCount = session.listaSecretaSlotCount ?? DEFAULT_LSMP_SLOT_COUNT;
  const challengeId = pickRandomChallengeId();
  const challenge = await getResolvedChallengeById(challengeId);

  if (!challenge) {
    throw new Error("Desafio não encontrado");
  }

  if (challenge.pool.length < slotCount) {
    throw new Error("Pool do tema insuficiente para o número de slots");
  }

  const drawnPlayerIds = drawRoundFromChallengeWithCount(challenge, slotCount);
  const slots = buildSlotsFromDraw(challenge, drawnPlayerIds);
  const hostId = session.creatorParticipantId ?? players[0]!.id;
  const guestId = players.find((p) => p.id !== hostId)?.id ?? players[1]!.id;
  const playerOrder: [string, string] = [hostId, guestId];

  return {
    title: challenge.title,
    filters: JSON.stringify(challenge.searchFilters ?? {}),
    payload: {
      challengeId,
      drawnPlayerIds,
      slots,
      playerOrder,
      activeParticipantId: firstPlayerForRound(session, roundNumber),
      phase: "open",
      slotWins: initialSlotWins(playerOrder),
      showMetaHint: shouldShowMetaHint(challenge.searchFilters),
    },
  };
}

export async function setListaSecretaMpConfig(
  sessionCode: string,
  participantId: string,
  guestToken: string | undefined | null,
  totalRounds: number,
  slotCount: number
) {
  const { session } = await assertCreator(sessionCode, participantId, guestToken);

  if (session.gameMode !== "lista-secreta-mp") {
    throw new Error("Esta sala não é Lista Secreta 1v1");
  }

  if (session.status !== "setup") {
    throw new Error("A configuração só pode ser alterada no lobby");
  }

  if (totalRounds < MIN_LSMP_ROUNDS || totalRounds > MAX_LSMP_ROUNDS) {
    throw new Error(
      `Número de rodadas deve ser entre ${MIN_LSMP_ROUNDS} e ${MAX_LSMP_ROUNDS}`
    );
  }

  if (slotCount < MIN_LSMP_SLOT_COUNT || slotCount > MAX_LSMP_SLOT_COUNT) {
    throw new Error(
      `Número de jogadores secretos deve ser entre ${MIN_LSMP_SLOT_COUNT} e ${MAX_LSMP_SLOT_COUNT}`
    );
  }

  await prisma.session.update({
    where: { id: session.id },
    data: {
      listaSecretaTotalRounds: totalRounds,
      listaSecretaSlotCount: slotCount,
    },
  });

  return { totalRounds, slotCount };
}

export async function startListaSecretaMpSession(
  sessionCode: string,
  participantId: string,
  guestToken?: string | null
) {
  await assertCreator(sessionCode, participantId, guestToken);

  const session = await getSessionOrThrow(sessionCode);

  if (session.gameMode !== "lista-secreta-mp") {
    throw new Error("Esta sala não é Lista Secreta 1v1");
  }

  if (session.status !== "setup") {
    throw new Error("A sala já foi iniciada");
  }

  getLsmpPlayers(session);

  if (!session.listaSecretaTotalRounds || !session.listaSecretaSlotCount) {
    throw new Error("Configure rodadas e jogadores secretos antes de iniciar");
  }

  const totalRounds = session.listaSecretaTotalRounds;
  const firstRound = await createRoundPayload(session, 1);

  await prisma.$transaction(async (tx) => {
    const roundCreates = Array.from({ length: totalRounds }, (_, index) => {
      const number = index + 1;
      if (number === 1) {
        return tx.round.create({
          data: {
            sessionId: session.id,
            number: 1,
            title: firstRound.title,
            topN: 1,
            filters: firstRound.filters,
            status: "open",
            cardOptions: serializePayload(firstRound.payload),
          },
        });
      }
      return tx.round.create({
        data: {
          sessionId: session.id,
          number,
          title: `Rodada ${number}`,
          topN: 1,
          status: "pending",
        },
      });
    });

    await Promise.all(roundCreates);

    await tx.session.update({
      where: { id: session.id },
      data: { status: "active", currentRoundNumber: 1 },
    });
  });
}

function aggregateRoundsWon(session: SessionFull): Record<string, number> {
  const wins: Record<string, number> = {};
  for (const participant of getLsmpPlayers(session)) {
    wins[participant.id] = 0;
  }

  for (const round of session.rounds) {
    const payload = parseListaSecretaMpPayload(round.cardOptions);
    if (payload?.phase === "completed" && payload.winnerParticipantId) {
      wins[payload.winnerParticipantId] =
        (wins[payload.winnerParticipantId] ?? 0) + 1;
    }
  }

  return wins;
}

function aggregateTotalSlots(session: SessionFull): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const participant of getLsmpPlayers(session)) {
    totals[participant.id] = 0;
  }

  for (const round of session.rounds) {
    const payload = parseListaSecretaMpPayload(round.cardOptions);
    if (!payload) continue;
    for (const [participantId, count] of Object.entries(payload.slotWins)) {
      totals[participantId] = (totals[participantId] ?? 0) + count;
    }
  }

  return totals;
}

function buildRoundRecap(
  roundNumber: number,
  roundTitle: string,
  payload: ListaSecretaMpRoundPayload,
  participants: { id: string; displayName: string }[]
): ListaSecretaMpRoundRecap {
  const winner = payload.winnerParticipantId
    ? participants.find((p) => p.id === payload.winnerParticipantId)
    : undefined;
  const { tied } = resolveRoundWinner(payload.slotWins, payload.playerOrder);

  return {
    roundNumber,
    title: roundTitle,
    challengeId: payload.challengeId,
    winnerParticipantId: payload.winnerParticipantId,
    winnerDisplayName: winner?.displayName,
    slotWins: { ...payload.slotWins },
    slots: toPublicSlots(payload, participants),
    tied: tied && !payload.winnerParticipantId,
  };
}

export function buildListaSecretaMpSessionResult(
  session: SessionFull
): ListaSecretaMpSessionResult {
  const participants = getLsmpPlayers(session);
  const totalSlots = aggregateTotalSlots(session);
  const roundsWon = aggregateRoundsWon(session);

  const standings: ListaSecretaMpStandingEntry[] = participants
    .map((participant) => ({
      participantId: participant.id,
      displayName: participant.displayName,
      totalSlots: totalSlots[participant.id] ?? 0,
      roundsWon: roundsWon[participant.id] ?? 0,
      rank: 0,
    }))
    .sort((a, b) => {
      if (b.roundsWon !== a.roundsWon) return b.roundsWon - a.roundsWon;
      return b.totalSlots - a.totalSlots;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const rounds: ListaSecretaMpRoundRecap[] = session.rounds
    .filter((round) => {
      const payload = parseListaSecretaMpPayload(round.cardOptions);
      return payload?.phase === "completed";
    })
    .map((round) => {
      const payload = parseListaSecretaMpPayload(round.cardOptions)!;
      return buildRoundRecap(round.number, round.title, payload, participants);
    });

  return {
    outcome: "completed",
    standings,
    rounds,
  };
}

async function openNextRound(session: SessionFull, nextRoundNumber: number) {
  const nextRoundData = await createRoundPayload(session, nextRoundNumber);

  await prisma.$transaction([
    prisma.session.update({
      where: { id: session.id },
      data: { currentRoundNumber: nextRoundNumber },
    }),
    prisma.round.update({
      where: {
        sessionId_number: {
          sessionId: session.id,
          number: nextRoundNumber,
        },
      },
      data: {
        title: nextRoundData.title,
        filters: nextRoundData.filters,
        status: "open",
        cardOptions: serializePayload(nextRoundData.payload),
      },
    }),
  ]);
}

export async function applyListaSecretaMpPick(
  sessionCode: string,
  participantId: string,
  guestToken: string | undefined | null,
  guessedPlayerId: string
) {
  const session = await getSessionOrThrow(sessionCode);

  if (session.gameMode !== "lista-secreta-mp") {
    throw new Error("Esta sala não é Lista Secreta 1v1");
  }

  if (session.status !== "active") {
    throw new Error("A partida não está ativa");
  }

  const participant = session.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new Error("Participante não encontrado");
  }

  if (participant.guestToken !== guestToken) {
    throw new Error("Não autorizado");
  }

  const currentRoundRecord = getCurrentRound(session);
  if (!currentRoundRecord || currentRoundRecord.status !== "open") {
    throw new Error("Rodada não está aberta");
  }

  const payload = parseListaSecretaMpPayload(currentRoundRecord.cardOptions);
  if (!payload || payload.phase !== "open") {
    throw new Error("Rodada inválida");
  }

  if (payload.activeParticipantId !== participantId) {
    throw new Error("Não é a sua vez");
  }

  const existingPick = await prisma.pick.findFirst({
    where: {
      roundId: currentRoundRecord.id,
      participantId,
      playerId: guessedPlayerId,
    },
  });

  if (existingPick) {
    const view = buildListaSecretaMpViewState(session, participantId);
    return { kind: "duplicate" as const, view };
  }

  const guessedPlayer = await prisma.player.findUnique({
    where: { id: guessedPlayerId },
  });

  if (!guessedPlayer) {
    throw new Error("Jogador não encontrado");
  }

  const pickCount = await prisma.pick.count({
    where: { roundId: currentRoundRecord.id, participantId },
  });

  const targetSlot = payload.slots.find(
    (slot) =>
      slot.secretPlayerId === guessedPlayerId && !slot.revealedByParticipantId
  );
  const isCorrect = Boolean(targetSlot);

  let nextPayload: ListaSecretaMpRoundPayload = { ...payload };
  let roundCompleted = false;
  let sessionCompleted = false;
  let nextRoundNumber: number | null = null;

  if (isCorrect && targetSlot) {
    nextPayload = {
      ...nextPayload,
      slots: nextPayload.slots.map((slot) =>
        slot.slotIndex === targetSlot.slotIndex
          ? {
              ...slot,
              playerName: guessedPlayer.name,
              revealedByParticipantId: participantId,
            }
          : slot
      ),
      slotWins: {
        ...nextPayload.slotWins,
        [participantId]: (nextPayload.slotWins[participantId] ?? 0) + 1,
      },
    };

    const allRevealed = nextPayload.slots.every(
      (slot) => slot.revealedByParticipantId
    );

    if (allRevealed) {
      const { winnerParticipantId } = resolveRoundWinner(
        nextPayload.slotWins,
        nextPayload.playerOrder
      );
      nextPayload = {
        ...nextPayload,
        phase: "completed",
        winnerParticipantId,
      };
      roundCompleted = true;

      const totalRounds = session.listaSecretaTotalRounds ?? session.rounds.length;
      if (session.currentRoundNumber >= totalRounds) {
        sessionCompleted = true;
      } else {
        nextRoundNumber = session.currentRoundNumber + 1;
      }
    } else {
      nextPayload = {
        ...nextPayload,
        activeParticipantId: otherParticipant(
          nextPayload.playerOrder,
          participantId
        ),
      };
    }
  } else {
    nextPayload = {
      ...nextPayload,
      activeParticipantId: otherParticipant(
        nextPayload.playerOrder,
        participantId
      ),
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.pick.create({
      data: {
        roundId: currentRoundRecord.id,
        participantId,
        playerId: guessedPlayerId,
        rank: pickCount + 1,
      },
    });

    await tx.round.update({
      where: { id: currentRoundRecord.id },
      data: {
        status: roundCompleted ? "completed" : "open",
        cardOptions: serializePayload(nextPayload),
      },
    });

    if (sessionCompleted) {
      const updatedSession = await tx.session.findUnique({
        where: { id: session.id },
        include: {
          participants: { orderBy: { joinedAt: "asc" } },
          rounds: { orderBy: { number: "asc" } },
          result: true,
        },
      });

      if (updatedSession) {
        const result = buildListaSecretaMpSessionResult(updatedSession);
        await tx.session.update({
          where: { id: session.id },
          data: { status: "completed" },
        });
        await tx.sessionResult.upsert({
          where: { sessionId: session.id },
          create: { sessionId: session.id, data: JSON.stringify(result) },
          update: { data: JSON.stringify(result) },
        });
      }
    }
  });

  if (nextRoundNumber && !sessionCompleted) {
    const refreshed = await getSessionOrThrow(sessionCode);
    await openNextRound(refreshed, nextRoundNumber);
  }

  const refreshedSession = await getSessionOrThrow(sessionCode);
  const view = buildListaSecretaMpViewState(refreshedSession, participantId);

  return {
    kind: isCorrect ? ("correct" as const) : ("wrong" as const),
    correct: isCorrect,
    roundCompleted,
    sessionCompleted,
    view,
    guessedPlayerName: guessedPlayer.name,
    revealedSlotIndex: targetSlot?.slotIndex,
  };
}

export function buildListaSecretaMpViewState(
  session: SessionFull,
  viewerParticipantId: string | null
): ListaSecretaMpViewState | null {
  if (session.gameMode !== "lista-secreta-mp") return null;

  const currentRoundRecord = getCurrentRound(session);
  if (!currentRoundRecord) return null;

  const payload = parseListaSecretaMpPayload(currentRoundRecord.cardOptions);
  if (!payload) return null;

  const participants = getLsmpPlayers(session);
  const activeParticipant = participants.find(
    (p) => p.id === payload.activeParticipantId
  );
  const challenge = GUESS_TOP_CHALLENGES.find((c) => c.id === payload.challengeId);
  const roundsWon = aggregateRoundsWon(session);

  const roundStatus =
    currentRoundRecord.status === "completed" ? "completed" : "open";

  const playerColors: Record<string, "host" | "guest"> = {
    [payload.playerOrder[0]]: "host",
    [payload.playerOrder[1]]: "guest",
  };

  let lastWinner: ListaSecretaMpViewState["lastWinner"] | undefined;
  if (payload.phase === "completed") {
    const { tied } = resolveRoundWinner(payload.slotWins, payload.playerOrder);
    if (payload.winnerParticipantId) {
      const winner = participants.find(
        (p) => p.id === payload.winnerParticipantId
      );
      if (winner) {
        lastWinner = {
          participantId: winner.id,
          displayName: winner.displayName,
          slotWins: payload.slotWins[winner.id] ?? 0,
          tied: false,
        };
      }
    } else if (tied) {
      lastWinner = {
        participantId: "",
        displayName: "Empate",
        slotWins: payload.slotWins[payload.playerOrder[0]] ?? 0,
        tied: true,
      };
    }
  }

  return {
    roundNumber: session.currentRoundNumber,
    totalRounds: session.listaSecretaTotalRounds ?? session.rounds.length,
    title: currentRoundRecord.title,
    description: challenge?.description ?? "",
    searchFilters: parseFilters(currentRoundRecord.filters),
    showMetaHint: payload.showMetaHint,
    slots: toPublicSlots(payload, participants),
    activeParticipantId: payload.activeParticipantId,
    activeParticipantName: activeParticipant?.displayName ?? "",
    isMyTurn: viewerParticipantId === payload.activeParticipantId,
    roundStatus,
    slotWins: { ...payload.slotWins },
    roundsWon,
    playerColors,
    lastWinner,
  };
}
