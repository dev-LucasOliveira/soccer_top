import { prisma } from "@/lib/db";
import { assertCreator } from "@/lib/creator-auth";
import { areRoundsValid } from "@/lib/round-config";
import {
  computeRoundResult,
  computeSessionFinalResult,
} from "@/lib/consensus";
import { getCurrentRound } from "@/lib/round";
import {
  generateListAliases,
  parseListAliases,
} from "@/lib/voting";
import type { AnonymousList, RoundResultData, VoteState } from "@/lib/types";

const sessionInclude = {
  participants: {
    orderBy: { joinedAt: "asc" as const },
  },
  rounds: {
    orderBy: { number: "asc" as const },
    include: {
      result: true,
    },
  },
  result: true,
};

const roundWithPicksInclude = {
  picks: {
    include: {
      player: true,
      participant: true,
    },
    orderBy: { rank: "asc" as const },
  },
  votes: true,
};

export async function getSessionWithRounds(sessionCode: string) {
  return prisma.session.findUnique({
    where: { code: sessionCode },
    include: sessionInclude,
  });
}

export async function getActiveRound(sessionCode: string) {
  const session = await getSessionWithRounds(sessionCode);
  if (!session) return { session: null, round: null };

  const round = getCurrentRound(session);
  if (!round) return { session, round: null };

  const roundFull = await prisma.round.findUnique({
    where: { id: round.id },
    include: roundWithPicksInclude,
  });

  return { session, round: roundFull };
}

export async function advanceSession(
  sessionCode: string,
  participantId: string,
  guestToken?: string | null
) {
  const { session } = await assertCreator(
    sessionCode,
    participantId,
    guestToken
  );

  const sessionFull = await prisma.session.findUnique({
    where: { id: session.id },
    include: {
      participants: { orderBy: { joinedAt: "asc" } },
      rounds: { orderBy: { number: "asc" } },
    },
  });

  if (!sessionFull) {
    throw new Error("Sala não encontrada");
  }

  const currentRound = getCurrentRound(sessionFull);
  if (!currentRound && sessionFull.status !== "setup") {
    throw new Error("Rodada não encontrada");
  }

  if (sessionFull.status === "setup") {
    if (sessionFull.participants.length < 2) {
      throw new Error("Mínimo de 2 participantes para iniciar");
    }

    if (!areRoundsValid(sessionFull.rounds)) {
      throw new Error("Configure pelo menos 1 rodada válida antes de iniciar");
    }

    if (!currentRound) {
      throw new Error("Rodada não encontrada");
    }

    await prisma.$transaction([
      prisma.session.update({
        where: { id: sessionFull.id },
        data: { status: "active" },
      }),
      prisma.round.update({
        where: { id: currentRound.id },
        data: { status: "open" },
      }),
    ]);
  } else if (sessionFull.status === "active") {
    if (!currentRound) {
      throw new Error("Rodada não encontrada");
    }

    if (currentRound.status === "open") {
      const allConfirmed = sessionFull.participants.every(
        (p) => p.status === "confirmed"
      );
      if (!allConfirmed) {
        throw new Error(
          "Todos os participantes precisam confirmar o ranking antes de avançar"
        );
      }

      const listAliases = generateListAliases(sessionFull.participants);

      await prisma.round.update({
        where: { id: currentRound.id },
        data: {
          status: "voting",
          listAliases: JSON.stringify(listAliases),
        },
      });
    } else if (currentRound.status === "voting") {
      const votes = await prisma.vote.count({
        where: { roundId: currentRound.id },
      });
      if (votes < sessionFull.participants.length) {
        throw new Error("Todos os participantes precisam votar antes de encerrar");
      }

      const roundFull = await prisma.round.findUnique({
        where: { id: currentRound.id },
        include: {
          votes: true,
          picks: {
            include: { player: true, participant: true },
            orderBy: { rank: "asc" },
          },
        },
      });

      if (!roundFull) throw new Error("Rodada não encontrada");

      const aliases = parseListAliases(roundFull.listAliases);
      const participantsWithPicks = sessionFull.participants.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        picks: roundFull.picks
          .filter((pick) => pick.participantId === p.id)
          .map((pick) => ({
            rank: pick.rank,
            playerId: pick.playerId,
            player: pick.player,
          })),
      }));

      const resultData = computeRoundResult(
        participantsWithPicks,
        roundFull.votes,
        aliases,
        currentRound.number,
        currentRound.title
      );

      const totalRounds = sessionFull.rounds.length;
      const isLastRound = currentRound.number >= totalRounds;

      if (isLastRound) {
        const allRoundResults = await prisma.roundResult.findMany({
          where: { round: { sessionId: sessionFull.id } },
          include: { round: true },
          orderBy: { round: { number: "asc" } },
        });

        const existingResults: RoundResultData[] = allRoundResults.map((r) =>
          JSON.parse(r.data)
        );
        existingResults.push(resultData);

        const finalResult = computeSessionFinalResult(
          sessionFull.participants,
          existingResults
        );

        await prisma.$transaction([
          prisma.round.update({
            where: { id: currentRound.id },
            data: { status: "completed" },
          }),
          prisma.roundResult.upsert({
            where: { roundId: currentRound.id },
            create: {
              roundId: currentRound.id,
              data: JSON.stringify(resultData),
            },
            update: { data: JSON.stringify(resultData) },
          }),
          prisma.session.update({
            where: { id: sessionFull.id },
            data: { status: "completed" },
          }),
          prisma.sessionResult.upsert({
            where: { sessionId: sessionFull.id },
            create: {
              sessionId: sessionFull.id,
              data: JSON.stringify(finalResult),
            },
            update: { data: JSON.stringify(finalResult) },
          }),
        ]);
      } else {
        await prisma.$transaction([
          prisma.round.update({
            where: { id: currentRound.id },
            data: { status: "completed" },
          }),
          prisma.roundResult.upsert({
            where: { roundId: currentRound.id },
            create: {
              roundId: currentRound.id,
              data: JSON.stringify(resultData),
            },
            update: { data: JSON.stringify(resultData) },
          }),
        ]);
      }
    } else if (currentRound.status === "completed") {
      const nextRound = sessionFull.rounds.find(
        (r) => r.number === sessionFull.currentRoundNumber + 1
      );
      if (!nextRound) {
        throw new Error("Não há próxima rodada");
      }

      await prisma.$transaction([
        prisma.session.update({
          where: { id: sessionFull.id },
          data: { currentRoundNumber: nextRound.number },
        }),
        prisma.round.update({
          where: { id: nextRound.id },
          data: { status: "open" },
        }),
        prisma.participant.updateMany({
          where: { sessionId: sessionFull.id },
          data: { status: "building", confirmedAt: null },
        }),
      ]);
    } else {
      throw new Error("Rodada não está em fase avançável");
    }
  } else {
    throw new Error("Sala já finalizada");
  }

  return getSessionWithRounds(sessionCode);
}

export async function getVoteState(
  sessionCode: string,
  participantId: string
): Promise<VoteState> {
  const { session, round } = await getActiveRound(sessionCode);

  if (!session) {
    throw new Error("Sala não encontrada");
  }

  if (!round) {
    throw new Error("Rodada não encontrada");
  }

  if (round.status !== "voting") {
    throw new Error("Rodada não está em fase de votação");
  }

  const aliases = parseListAliases(round.listAliases);
  const voteCounts = new Map<string, number>();

  for (const vote of round.votes) {
    voteCounts.set(
      vote.targetParticipantId,
      (voteCounts.get(vote.targetParticipantId) ?? 0) + 1
    );
  }

  const myVote = round.votes.find(
    (v) => v.voterParticipantId === participantId
  );

  const picksByParticipant = new Map<string, typeof round.picks>();
  for (const pick of round.picks) {
    const list = picksByParticipant.get(pick.participantId) ?? [];
    list.push(pick);
    picksByParticipant.set(pick.participantId, list);
  }

  const lists: AnonymousList[] = Object.entries(aliases)
    .sort(([, a], [, b]) => a.localeCompare(b))
    .map(([pid, alias]) => {
      const picks = picksByParticipant.get(pid) ?? [];
      return {
        alias,
        picks: picks.map((pick) => ({
          rank: pick.rank,
          playerName: pick.player.name,
          position: pick.player.primaryPosition,
          nationality: pick.player.nationality,
        })),
        voteCount: voteCounts.get(pid) ?? 0,
      };
    });

  return {
    lists,
    myAlias: aliases[participantId] ?? null,
    hasVoted: !!myVote,
    votedAlias: myVote ? aliases[myVote.targetParticipantId] ?? null : null,
    totalVoters: session.participants.length,
    votedCount: round.votes.length,
    roundNumber: round.number,
    roundTitle: round.title,
  };
}

export async function castVote(
  sessionCode: string,
  voterParticipantId: string,
  alias: string
) {
  const { session, round } = await getActiveRound(sessionCode);

  if (!session) {
    throw new Error("Sala não encontrada");
  }

  if (!round || round.status !== "voting") {
    throw new Error("Votação não está aberta");
  }

  const voter = session.participants.find((p) => p.id === voterParticipantId);
  if (!voter) {
    throw new Error("Participante não encontrado");
  }

  const aliases = parseListAliases(round.listAliases);
  const targetParticipantId = Object.entries(aliases).find(
    ([, a]) => a === alias
  )?.[0];

  if (!targetParticipantId) {
    throw new Error("Lista inválida");
  }

  if (targetParticipantId === voterParticipantId) {
    throw new Error("Você não pode votar no seu próprio ranking");
  }

  const existingVote = round.votes.find(
    (v) => v.voterParticipantId === voterParticipantId
  );
  if (existingVote) {
    throw new Error("Você já votou nesta rodada");
  }

  await prisma.vote.create({
    data: {
      roundId: round.id,
      voterParticipantId,
      targetParticipantId,
    },
  });

  return getVoteState(sessionCode, voterParticipantId);
}

export async function getStandings(sessionCode: string) {
  const session = await getSessionWithRounds(sessionCode);
  if (!session) return null;

  const completedResults = await prisma.roundResult.findMany({
    where: {
      round: {
        sessionId: session.id,
        status: "completed",
      },
    },
    include: { round: true },
    orderBy: { round: { number: "asc" } },
  });

  const roundResults = completedResults.map(
    (r) => JSON.parse(r.data) as RoundResultData
  );

  if (roundResults.length === 0) return [];

  return computeSessionFinalResult(session.participants, roundResults).standings;
}
