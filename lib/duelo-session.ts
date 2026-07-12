import { prisma } from "@/lib/db";
import { assertCreator } from "@/lib/creator-auth";
import { parseFilters } from "@/lib/filters";
import { getPlayers } from "@/lib/participants";
import { getCurrentRound } from "@/lib/round";
import {
  DEFAULT_DUELO_ROUNDS,
  MAX_DUELO_ROUNDS,
  MIN_DUELO_PLAYERS,
  MIN_DUELO_ROUNDS,
} from "@/lib/duelo-constants";
import {
  buildPlayerHintLadder,
  drawSecretPlayerId,
  getSecretPlayer,
  getUmSoChallengeById,
  pickRandomChallengeId,
} from "@/lib/um-so-score";
import { calculateRoundPoints } from "@/lib/um-so-score-calc";
import type {
  DueloRoundPayload,
  DueloRoundRecap,
  DueloSessionResult,
  DueloStandingEntry,
  DueloViewState,
  DueloWrongGuessView,
} from "@/lib/types";
import { GUESS_TOP_CHALLENGES } from "@/lib/guess-top-challenges";
import {
  getTurnDeadline,
  isTurnExpired,
  nowIso,
  validatePickTimeLimit,
} from "@/lib/pick-time-limit";

export {
  MIN_DUELO_PLAYERS,
  DEFAULT_DUELO_ROUNDS,
  MIN_DUELO_ROUNDS,
  MAX_DUELO_ROUNDS,
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

export function parseDueloPayload(raw: string | null | undefined): DueloRoundPayload | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DueloRoundPayload;
  } catch {
    return null;
  }
}

function serializeDueloPayload(payload: DueloRoundPayload): string {
  return JSON.stringify(payload);
}

function setActiveTurn(
  payload: DueloRoundPayload,
  activeParticipantId: string
): DueloRoundPayload {
  return {
    ...payload,
    activeParticipantId,
    turnStartedAt: nowIso(),
  };
}

function getDueloPlayers(session: SessionFull) {
  const players = getPlayers(session.participants);
  if (players.length !== MIN_DUELO_PLAYERS) {
    throw new Error("O duelo precisa de exatamente 2 jogadores");
  }
  return players;
}

function firstPlayerForRound(
  session: SessionFull,
  roundNumber: number
): string {
  const players = getDueloPlayers(session);
  const hostId = session.creatorParticipantId ?? players[0]!.id;
  const guestId = players.find((p) => p.id !== hostId)?.id ?? players[1]!.id;
  return roundNumber % 2 === 1 ? hostId : guestId;
}

async function createDueloRoundPayload(
  session: SessionFull,
  roundNumber: number
): Promise<{
  title: string;
  filters: string;
  payload: DueloRoundPayload;
}> {
  const players = getDueloPlayers(session);
  const challengeId = pickRandomChallengeId();
  const challenge = await getUmSoChallengeById(challengeId);
  if (!challenge) {
    throw new Error("Desafio não encontrado");
  }

  const secretPlayerId = drawSecretPlayerId(challenge);
  const secretPlayer = getSecretPlayer(challenge, secretPlayerId);
  if (!secretPlayer) {
    throw new Error("Jogador secreto inválido");
  }

  const hintLadder = buildPlayerHintLadder(secretPlayer, challenge);
  const hostId = session.creatorParticipantId ?? players[0]!.id;
  const guestId = players.find((p) => p.id !== hostId)?.id ?? players[1]!.id;
  const playerOrder: [string, string] = [hostId, guestId];
  const activeParticipantId = firstPlayerForRound(session, roundNumber);

  return {
    title: challenge.title,
    filters: JSON.stringify(challenge.searchFilters ?? {}),
    payload: {
      challengeId,
      secretPlayerId,
      hintsRevealed: 0,
      hintLadder,
      playerOrder,
      activeParticipantId,
      phase: "open",
      wrongGuesses: [],
      secretPlayerName: secretPlayer.playerName,
      turnStartedAt: nowIso(),
    },
  };
}

export async function setDueloConfig(
  sessionCode: string,
  participantId: string,
  guestToken: string | undefined | null,
  totalRounds: number,
  pickTimeLimitSeconds?: number | null
) {
  const { session } = await assertCreator(sessionCode, participantId, guestToken);

  if (session.gameMode !== "duelo") {
    throw new Error("Esta sala não é um duelo");
  }

  if (session.status !== "setup") {
    throw new Error("A configuração só pode ser alterada no lobby");
  }

  if (totalRounds < MIN_DUELO_ROUNDS || totalRounds > MAX_DUELO_ROUNDS) {
    throw new Error(
      `Número de rodadas deve ser entre ${MIN_DUELO_ROUNDS} e ${MAX_DUELO_ROUNDS}`
    );
  }

  const validatedLimit = validatePickTimeLimit(pickTimeLimitSeconds);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      umSoTotalRounds: totalRounds,
      pickTimeLimitSeconds: validatedLimit,
    },
  });

  return { totalRounds, pickTimeLimitSeconds: validatedLimit };
}

export async function startDueloSession(
  sessionCode: string,
  participantId: string,
  guestToken?: string | null
) {
  await assertCreator(sessionCode, participantId, guestToken);

  const session = await getSessionOrThrow(sessionCode);

  if (session.gameMode !== "duelo") {
    throw new Error("Esta sala não é um duelo");
  }

  if (session.status !== "setup") {
    throw new Error("A sala já foi iniciada");
  }

  getDueloPlayers(session);

  const totalRounds = session.umSoTotalRounds ?? DEFAULT_DUELO_ROUNDS;

  const firstRound = await createDueloRoundPayload(session, 1);

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
            cardOptions: serializeDueloPayload(firstRound.payload),
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
      data: {
        status: "active",
        currentRoundNumber: 1,
        umSoTotalRounds: totalRounds,
      },
    });
  });
}

function aggregateScores(session: SessionFull): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const participant of getPlayers(session.participants)) {
    scores[participant.id] = 0;
  }

  for (const round of session.rounds) {
    const payload = parseDueloPayload(round.cardOptions);
    if (payload?.winnerParticipantId && payload.pointsAwarded) {
      scores[payload.winnerParticipantId] =
        (scores[payload.winnerParticipantId] ?? 0) + payload.pointsAwarded;
    }
  }

  return scores;
}

function aggregateRoundsWon(session: SessionFull): Record<string, number> {
  const wins: Record<string, number> = {};
  for (const participant of getPlayers(session.participants)) {
    wins[participant.id] = 0;
  }

  for (const round of session.rounds) {
    const payload = parseDueloPayload(round.cardOptions);
    if (payload?.winnerParticipantId && payload.phase === "completed") {
      wins[payload.winnerParticipantId] =
        (wins[payload.winnerParticipantId] ?? 0) + 1;
    }
  }

  return wins;
}

function mapWrongGuessesForView(
  wrongGuesses: DueloRoundPayload["wrongGuesses"],
  participants: { id: string; displayName: string }[]
): DueloWrongGuessView[] {
  return wrongGuesses.map((guess) => ({
    participantId: guess.participantId,
    displayName:
      participants.find((p) => p.id === guess.participantId)?.displayName ?? "?",
    playerId: guess.playerId,
    playerName: guess.playerName,
  }));
}

function buildRoundRecap(
  roundNumber: number,
  roundTitle: string,
  payload: DueloRoundPayload,
  participants: { id: string; displayName: string }[]
): DueloRoundRecap {
  const winner = payload.winnerParticipantId
    ? participants.find((p) => p.id === payload.winnerParticipantId)
    : undefined;

  return {
    roundNumber,
    title: roundTitle,
    challengeId: payload.challengeId,
    winnerParticipantId: payload.winnerParticipantId,
    winnerDisplayName: winner?.displayName,
    pointsAwarded: payload.pointsAwarded,
    tierLabel: payload.tierLabel,
    hintsUsed: payload.hintsUsed,
    secretPlayerName: payload.secretPlayerName ?? "?",
    secretPlayerId: payload.secretPlayerId,
    hints: payload.hintLadder.slice(0, payload.hintsRevealed),
    failed: payload.phase === "failed",
    wrongGuesses: mapWrongGuessesForView(payload.wrongGuesses, participants),
  };
}

export function buildDueloSessionResult(session: SessionFull): DueloSessionResult {
  const participants = getPlayers(session.participants);
  const scores = aggregateScores(session);
  const roundsWon = aggregateRoundsWon(session);

  const standings: DueloStandingEntry[] = participants
    .map((participant) => ({
      participantId: participant.id,
      displayName: participant.displayName,
      totalPoints: scores[participant.id] ?? 0,
      roundsWon: roundsWon[participant.id] ?? 0,
      rank: 0,
    }))
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.roundsWon - a.roundsWon;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const rounds: DueloRoundRecap[] = session.rounds
    .filter((round) => {
      const payload = parseDueloPayload(round.cardOptions);
      return payload && payload.phase !== "open";
    })
    .map((round) => {
      const payload = parseDueloPayload(round.cardOptions)!;
      return buildRoundRecap(round.number, round.title, payload, participants);
    });

  const failedRound = rounds.some((round) => round.failed);

  return {
    outcome: failedRound ? "failed" : "completed",
    standings,
    rounds,
  };
}

async function openNextDueloRound(session: SessionFull, nextRoundNumber: number) {
  const nextRoundData = await createDueloRoundPayload(session, nextRoundNumber);

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
        cardOptions: serializeDueloPayload(nextRoundData.payload),
      },
    }),
  ]);
}

export async function applyDueloPick(
  sessionCode: string,
  participantId: string,
  guestToken: string | undefined | null,
  guessedPlayerId: string
) {
  const session = await getSessionOrThrow(sessionCode);

  if (session.gameMode !== "duelo") {
    throw new Error("Esta sala não é um duelo");
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

  const payload = parseDueloPayload(currentRoundRecord.cardOptions);
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
    const view = buildDueloViewState(session, participantId);
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

  const isCorrect = guessedPlayerId === payload.secretPlayerId;
  const [playerA, playerB] = payload.playerOrder;
  const totalHints = payload.hintLadder.length;

  let nextPayload: DueloRoundPayload = {
    ...payload,
    wrongGuesses: [
      ...payload.wrongGuesses,
      ...(isCorrect
        ? []
        : [
            {
              participantId,
              playerId: guessedPlayerId,
              playerName: guessedPlayer.name,
            },
          ]),
    ],
  };

  let sessionCompleted = false;
  let roundCompleted = false;
  let roundFailed = false;
  let nextRoundNumber: number | null = null;

  if (isCorrect) {
    const scoring = calculateRoundPoints(payload.hintsRevealed, 1);
    nextPayload = {
      ...nextPayload,
      phase: "completed",
      winnerParticipantId: participantId,
      pointsAwarded: scoring.points,
      tierLabel: scoring.tierLabel,
      tier: scoring.tier,
      hintsUsed: payload.hintsRevealed,
    };
    roundCompleted = true;

    const totalRounds = session.umSoTotalRounds ?? session.rounds.length;
    if (session.currentRoundNumber >= totalRounds) {
      sessionCompleted = true;
    } else {
      nextRoundNumber = session.currentRoundNumber + 1;
    }
  } else if (participantId === playerA) {
    nextPayload = setActiveTurn(nextPayload, playerB);
  } else {
    if (payload.hintsRevealed < totalHints) {
      nextPayload = setActiveTurn(
        {
          ...nextPayload,
          hintsRevealed: payload.hintsRevealed + 1,
        },
        playerA
      );
    } else {
      nextPayload = {
        ...nextPayload,
        phase: "failed",
      };
      roundFailed = true;
      sessionCompleted = true;
    }
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
        status: roundFailed ? "failed" : roundCompleted ? "completed" : "open",
        cardOptions: serializeDueloPayload(nextPayload),
      },
    });

    if (sessionCompleted) {
      await finalizeDueloSessionIfNeeded(tx, session.id, true);
    }
  });

  if (nextRoundNumber && !sessionCompleted) {
    const refreshed = await getSessionOrThrow(sessionCode);
    await openNextDueloRound(refreshed, nextRoundNumber);
  }

  const refreshedSession = await getSessionOrThrow(sessionCode);
  const view = buildDueloViewState(refreshedSession, participantId);

  return {
    kind: isCorrect ? ("correct" as const) : ("wrong" as const),
    duplicate: false,
    correct: isCorrect,
    roundCompleted,
    roundFailed,
    sessionCompleted,
    view,
    scoring: isCorrect
      ? calculateRoundPoints(payload.hintsRevealed, 1)
      : undefined,
    guessedPlayerName: guessedPlayer.name,
  };
}

async function finalizeDueloSessionIfNeeded(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  sessionId: string,
  sessionCompleted: boolean
) {
  if (!sessionCompleted) return;

  const updatedSession = await tx.session.findUnique({
    where: { id: sessionId },
    include: {
      participants: { orderBy: { joinedAt: "asc" } },
      rounds: { orderBy: { number: "asc" } },
      result: true,
    },
  });

  if (!updatedSession) return;

  const result = buildDueloSessionResult(updatedSession);
  await tx.session.update({
    where: { id: sessionId },
    data: { status: "completed" },
  });
  await tx.sessionResult.upsert({
    where: { sessionId },
    create: { sessionId, data: JSON.stringify(result) },
    update: { data: JSON.stringify(result) },
  });
}

export async function applyDueloTimeout(
  sessionCode: string,
  participantId: string,
  guestToken?: string | null
) {
  const session = await getSessionOrThrow(sessionCode);

  if (session.gameMode !== "duelo") {
    throw new Error("Esta sala não é um duelo");
  }

  if (session.status !== "active") {
    throw new Error("A partida não está ativa");
  }

  const participant = session.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new Error("Participante não encontrado");
  }

  if (guestToken !== undefined && participant.guestToken !== guestToken) {
    throw new Error("Não autorizado");
  }

  const currentRoundRecord = getCurrentRound(session);
  if (!currentRoundRecord || currentRoundRecord.status !== "open") {
    throw new Error("Rodada não está aberta");
  }

  const payload = parseDueloPayload(currentRoundRecord.cardOptions);
  if (!payload || payload.phase !== "open") {
    throw new Error("Rodada inválida");
  }

  if (payload.activeParticipantId !== participantId) {
    throw new Error("Não é a sua vez");
  }

  if (
    !isTurnExpired(payload.turnStartedAt, session.pickTimeLimitSeconds ?? null)
  ) {
    throw new Error("O tempo deste palpite ainda não expirou");
  }

  const [playerA, playerB] = payload.playerOrder;
  const totalHints = payload.hintLadder.length;

  let nextPayload: DueloRoundPayload = { ...payload };
  let sessionCompleted = false;
  const roundCompleted = false;
  let roundFailed = false;
  const nextRoundNumber: number | null = null;

  if (participantId === playerA) {
    nextPayload = setActiveTurn(nextPayload, playerB);
  } else if (payload.hintsRevealed < totalHints) {
    nextPayload = setActiveTurn(
      {
        ...nextPayload,
        hintsRevealed: payload.hintsRevealed + 1,
      },
      playerA
    );
  } else {
    nextPayload = {
      ...nextPayload,
      phase: "failed",
    };
    roundFailed = true;
    sessionCompleted = true;
  }

  await prisma.$transaction(async (tx) => {
    await tx.round.update({
      where: { id: currentRoundRecord.id },
      data: {
        status: roundFailed ? "failed" : roundCompleted ? "completed" : "open",
        cardOptions: serializeDueloPayload(nextPayload),
      },
    });

    await finalizeDueloSessionIfNeeded(tx, session.id, sessionCompleted);
  });

  if (nextRoundNumber && !sessionCompleted) {
    const refreshed = await getSessionOrThrow(sessionCode);
    await openNextDueloRound(refreshed, nextRoundNumber);
  }

  const refreshedSession = await getSessionOrThrow(sessionCode);
  const view = buildDueloViewState(refreshedSession, participantId);

  return {
    timedOut: true,
    roundCompleted,
    roundFailed,
    sessionCompleted,
    view,
  };
}

export function buildDueloViewState(
  session: SessionFull,
  viewerParticipantId: string | null
): DueloViewState | null {
  if (session.gameMode !== "duelo") return null;

  const currentRoundRecord = getCurrentRound(session);
  if (!currentRoundRecord) return null;

  const payload = parseDueloPayload(currentRoundRecord.cardOptions);
  const participants = getPlayers(session.participants);
  const activeParticipant = participants.find(
    (p) => p.id === payload?.activeParticipantId
  );

  const challenge = payload
    ? GUESS_TOP_CHALLENGES.find((c) => c.id === payload.challengeId)
    : null;

  const scores = aggregateScores(session);
  const roundsWon = aggregateRoundsWon(session);

  const roundStatus =
    currentRoundRecord.status === "failed"
      ? "failed"
      : currentRoundRecord.status === "completed"
        ? "completed"
        : "open";

  let secretReveal:
    | DueloViewState["secretReveal"]
    | undefined;
  let lastWinner: DueloViewState["lastWinner"] | undefined;

  if (
    payload &&
    (payload.phase === "completed" || payload.phase === "failed") &&
    payload.secretPlayerName
  ) {
    const secret = payload.secretPlayerId;
    secretReveal = {
      playerId: secret,
      playerName: payload.secretPlayerName,
      nationality: "",
      position: "",
    };
  }

  if (payload?.winnerParticipantId && payload.pointsAwarded) {
    const winner = participants.find(
      (p) => p.id === payload.winnerParticipantId
    );
    if (winner) {
      lastWinner = {
        participantId: winner.id,
        displayName: winner.displayName,
        points: payload.pointsAwarded,
        tierLabel: payload.tierLabel ?? "",
      };
    }
  }

  return {
    roundNumber: session.currentRoundNumber,
    totalRounds: session.umSoTotalRounds ?? session.rounds.length,
    title: currentRoundRecord.title,
    description: challenge?.description ?? "",
    searchFilters: parseFilters(currentRoundRecord.filters),
    hintsRevealed: payload?.hintLadder.slice(0, payload.hintsRevealed) ?? [],
    totalHints: payload?.hintLadder.length ?? 0,
    activeParticipantId: payload?.activeParticipantId ?? "",
    activeParticipantName: activeParticipant?.displayName ?? "",
    isMyTurn: viewerParticipantId === payload?.activeParticipantId,
    roundStatus,
    scores,
    roundsWon,
    secretReveal,
    lastWinner,
    wrongGuesses: mapWrongGuessesForView(
      payload?.wrongGuesses ?? [],
      participants
    ),
    pickTimeLimitSeconds: session.pickTimeLimitSeconds ?? null,
    turnStartedAt: payload?.turnStartedAt ?? null,
    turnDeadlineAt: getTurnDeadline(
      payload?.turnStartedAt,
      session.pickTimeLimitSeconds
    ),
  };
}

export async function getDueloView(
  sessionCode: string,
  viewerParticipantId: string | null
) {
  const session = await getSessionOrThrow(sessionCode);
  return buildDueloViewState(session, viewerParticipantId);
}
