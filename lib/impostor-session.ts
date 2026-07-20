import { prisma } from "@/lib/db";
import { assertCreator } from "@/lib/creator-auth";
import { getPlayers, isSpectator } from "@/lib/participants";
import { getActiveImpostorRound } from "@/lib/round";
import {
  buildRoundCardOptions,
  getImpostorTheme,
  listImpostorThemes,
  pickRandomImpostorThemes,
} from "@/lib/impostor-themes";
import {
  buildRoundImpostorFilters,
  getRoundImpostorThemeId,
  IMPOSTOR_SESSION_DISPLAY_TITLE,
  maskThemeTitleForViewer,
  resolveImpostorRoundTheme,
} from "@/lib/impostor-theme-access";
import {
  buildImpostorSessionResult,
  checkImpostorOutcome,
  resolveElimination,
} from "@/lib/impostor-result";
import {
  getImpostorTargetRank,
  IMPOSTOR_TARGET_RANKS,
  IMPOSTOR_TOP_N,
  IMPOSTOR_TOTAL_ROUNDS,
  MIN_IMPOSTOR_PLAYERS,
} from "@/lib/impostor-constants";
import type {
  ImpostorElimination,
  ImpostorSessionResult,
  ImpostorViewState,
  ImpostorVoteState,
} from "@/lib/types";
import {
  recordImpostorSessionMatch,
  safeRecordMatch,
} from "@/lib/match-recording";

export { getImpostorTargetRank, IMPOSTOR_TOTAL_ROUNDS, MIN_IMPOSTOR_PLAYERS };

async function resolvePlayerIdsByName(names: string[]) {
  const players = await prisma.player.findMany({
    where: { name: { in: names } },
  });
  const byName = new Map(players.map((player) => [player.name, player]));

  const missing = names.filter((name) => !byName.has(name));
  if (missing.length > 0) {
    throw new Error(`Jogadores não encontrados no banco: ${missing.join(", ")}`);
  }

  return byName;
}

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

async function getActiveRoundFull(sessionCode: string) {
  const session = await getSessionOrThrow(sessionCode);
  const currentRound = getActiveImpostorRound(session);
  if (!currentRound) {
    return { session, round: null };
  }

  const round = await prisma.round.findUnique({
    where: { id: currentRound.id },
    include: {
      picks: {
        include: { player: true, participant: true },
        orderBy: { rank: "asc" },
      },
      votes: true,
      result: true,
    },
  });

  return { session, round };
}

function parseCardOptions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function aggregateParticipantPicksForRound(
  roundId: string,
  participantId: string
) {
  const picks = await prisma.pick.findMany({
    where: {
      roundId,
      participantId,
    },
    include: { player: true },
    orderBy: { rank: "asc" },
  });

  return picks.map((pick) => ({
    rank: pick.rank,
    playerId: pick.playerId,
    playerName: pick.player.name,
  }));
}

async function aggregateParticipantPicks(
  sessionId: string,
  participantId: string,
  upToRoundNumber: number
) {
  const picks = await prisma.pick.findMany({
    where: {
      participantId,
      round: {
        sessionId,
        number: { lte: upToRoundNumber },
      },
    },
    include: { player: true },
    orderBy: { rank: "asc" },
  });

  return picks.map((pick) => ({
    rank: pick.rank,
    playerId: pick.playerId,
    playerName: pick.player.name,
  }));
}

async function createRoundSeedPicks(
  roundId: string,
  theme: { seededPicks: { rank: number; playerName: string }[] },
  participantIds: string[],
  playersByName: Map<string, { id: string }>,
  tx: Pick<typeof prisma, "pick"> = prisma
) {
  const seedPickData = participantIds.flatMap((participantId) =>
    theme.seededPicks.map((seed) => ({
      roundId,
      participantId,
      playerId: playersByName.get(seed.playerName)!.id,
      rank: seed.rank,
    }))
  );

  if (seedPickData.length > 0) {
    await tx.pick.createMany({ data: seedPickData });
  }
}

function collectSessionThemeTitles(
  rounds: { filters: string; title: string }[]
): string[] {
  return rounds.map((round) => {
    const themeId = getRoundImpostorThemeId(round.filters);
    if (themeId) {
      return getImpostorTheme(themeId)?.title ?? round.title;
    }
    return round.title;
  });
}

export async function setImpostorTheme(
  sessionCode: string,
  participantId: string,
  guestToken: string | undefined | null,
  themeId: string
) {
  await assertCreator(sessionCode, participantId, guestToken);

  const session = await getSessionOrThrow(sessionCode);
  if (session.gameMode !== "impostor") {
    throw new Error("Esta sala não é do modo impostor");
  }
  if (session.status !== "setup") {
    throw new Error("O tema só pode ser alterado antes de iniciar");
  }

  const theme = getImpostorTheme(themeId);
  if (!theme) {
    throw new Error("Tema inválido");
  }

  await prisma.session.update({
    where: { id: session.id },
    data: {
      impostorThemeId: themeId,
      title: theme.title,
    },
  });
}

export async function startImpostorGame(
  sessionCode: string,
  participantId: string,
  guestToken?: string | null
) {
  const { session } = await assertCreator(sessionCode, participantId, guestToken);

  if (session.gameMode !== "impostor") {
    throw new Error("Esta sala não é do modo impostor");
  }
  if (session.status !== "setup") {
    throw new Error("O jogo já foi iniciado");
  }

  const themes = pickRandomImpostorThemes(IMPOSTOR_TOTAL_ROUNDS);

  const players = getPlayers(
    (
      await prisma.participant.findMany({
        where: { sessionId: session.id },
        orderBy: { joinedAt: "asc" },
      })
    )
  );

  if (players.length < MIN_IMPOSTOR_PLAYERS) {
    throw new Error(`Mínimo de ${MIN_IMPOSTOR_PLAYERS} participantes para iniciar`);
  }

  const allNames = [
    ...new Set(
      themes.flatMap((theme) => [
        ...theme.seededPicks.map((pick) => pick.playerName),
        ...theme.pool,
      ])
    ),
  ];
  const playersByName = await resolvePlayerIdsByName(allNames);

  const impostor =
    players[Math.floor(Math.random() * players.length)];

  const roundCreates = themes.map((theme, index) => {
    const seededNames = theme.seededPicks.map((pick) => pick.playerName);
    const cardNames = buildRoundCardOptions(theme.pool, seededNames, 0);
    const cardIds = cardNames.map((name) => playersByName.get(name)!.id);

    return {
      number: index + 1,
      title: theme.title,
      topN: IMPOSTOR_TOP_N,
      filters: buildRoundImpostorFilters(theme.id),
      status: index === 0 ? "open" : "pending",
      cardOptions: JSON.stringify(cardIds),
      theme,
    };
  });

  await prisma.$transaction(async (tx) => {
    await tx.round.deleteMany({ where: { sessionId: session.id } });

    const createdRounds = await Promise.all(
      roundCreates.map(({ theme: _theme, ...round }) =>
        tx.round.create({
          data: {
            sessionId: session.id,
            ...round,
          },
        })
      )
    );

    const firstRound = createdRounds[0];
    const firstTheme = themes[0];
    await createRoundSeedPicks(
      firstRound.id,
      firstTheme,
      players.map((player) => player.id),
      playersByName,
      tx
    );

    await tx.session.update({
      where: { id: session.id },
      data: {
        status: "active",
        currentRoundNumber: 1,
        impostorParticipantId: impostor.id,
        impostorThemeId: null,
        title: IMPOSTOR_SESSION_DISPLAY_TITLE,
      },
    });
  });
}

export async function getImpostorView(
  sessionCode: string,
  participantId: string
): Promise<ImpostorViewState> {
  const { session, round } = await getActiveRoundFull(sessionCode);

  if (!session) {
    throw new Error("Sala não encontrada");
  }
  if (session.gameMode !== "impostor") {
    throw new Error("Esta sala não é do modo impostor");
  }
  if (!round) {
    throw new Error("Rodada não encontrada");
  }

  const viewer = session.participants.find((p) => p.id === participantId);
  if (!viewer) {
    throw new Error("Participante não encontrado");
  }

  const isImpostor =
    session.status === "active" &&
    session.impostorParticipantId === participantId;

  const roundThemeId = getRoundImpostorThemeId(round.filters);
  const theme = roundThemeId ? getImpostorTheme(roundThemeId) : null;
  const themeTitle = maskThemeTitleForViewer(
    theme?.title ?? round.title,
    isImpostor,
    round.status
  );

  const cardIds = parseCardOptions(round.cardOptions);
  const cardPlayers = cardIds.length
    ? await prisma.player.findMany({ where: { id: { in: cardIds } } })
    : [];
  const cardById = new Map(cardPlayers.map((player) => [player.id, player]));

  const myPicks = await aggregateParticipantPicksForRound(
    round.id,
    participantId
  );


  const showAllLists =
    round.status === "reveal" ||
    round.status === "voting" ||
    round.status === "completed";

  const participantLists = showAllLists
    ? await Promise.all(
        session.participants.map(async (participant) => ({
          participantId: participant.id,
          displayName: participant.displayName,
          status: participant.status as ImpostorViewState["participantLists"][number]["status"],
          picks: await aggregateParticipantPicksForRound(
            round.id,
            participant.id
          ),
          hasConfirmed:
            round.status === "open"
              ? participant.status === "confirmed"
              : true,
        }))
      )
    : [];

  const currentRoundPick = round.picks.find(
    (pick) =>
      pick.participantId === participantId &&
      pick.rank === getImpostorTargetRank(round.number)
  );

  return {
    themeTitle,
    isImpostor,
    roundNumber: round.number,
    totalRounds: IMPOSTOR_TOTAL_ROUNDS,
    targetRank: getImpostorTargetRank(round.number),
    roundStatus: round.status as ImpostorViewState["roundStatus"],
    myPicks,
    cardOptions: cardIds
      .map((id) => cardById.get(id))
      .filter(Boolean)
      .map((player) => ({
        playerId: player!.id,
        playerName: player!.name,
        position: player!.primaryPosition,
        nationality: player!.nationality,
      })),
    hasConfirmed:
      isSpectator(viewer) ||
      viewer.status === "confirmed" ||
      !!currentRoundPick,
    participantLists,
  };
}

export async function submitImpostorPick(
  sessionCode: string,
  participantId: string,
  playerId: string
) {
  const { session, round } = await getActiveRoundFull(sessionCode);

  if (!session || !round) {
    throw new Error("Rodada não encontrada");
  }
  if (session.gameMode !== "impostor") {
    throw new Error("Esta sala não é do modo impostor");
  }
  if (round.status !== "open") {
    throw new Error("A rodada não está aberta para escolhas");
  }

  const participant = session.participants.find((p) => p.id === participantId);
  if (!participant || isSpectator(participant)) {
    throw new Error("Você não pode escolher cartas nesta rodada");
  }

  const cardIds = parseCardOptions(round.cardOptions);
  if (!cardIds.includes(playerId)) {
    throw new Error("Carta inválida para esta rodada");
  }

  const targetRank = getImpostorTargetRank(round.number);
  const existingPick = round.picks.find(
    (pick) =>
      pick.participantId === participantId && pick.rank === targetRank
  );
  if (existingPick) {
    throw new Error("Você já escolheu uma carta nesta rodada");
  }

  await prisma.$transaction([
    prisma.pick.create({
      data: {
        roundId: round.id,
        participantId,
        playerId,
        rank: targetRank,
      },
    }),
    prisma.participant.update({
      where: { id: participantId },
      data: { status: "confirmed", confirmedAt: new Date() },
    }),
  ]);

  return getImpostorView(sessionCode, participantId);
}

export async function getImpostorVoteState(
  sessionCode: string,
  participantId: string
): Promise<ImpostorVoteState> {
  const { session, round } = await getActiveRoundFull(sessionCode);

  if (!session || !round) {
    throw new Error("Rodada não encontrada");
  }
  if (round.status !== "voting") {
    throw new Error("Rodada não está em fase de votação");
  }

  const viewer = session.participants.find((p) => p.id === participantId);
  if (!viewer) {
    throw new Error("Participante não encontrado");
  }

  const activePlayers = getPlayers(session.participants);
  const myVote = round.votes.find(
    (vote) => vote.voterParticipantId === participantId
  );

  return {
    participants: activePlayers.map((player) => ({
      id: player.id,
      displayName: player.displayName,
      status: player.status as ImpostorVoteState["participants"][number]["status"],
    })),
    hasVoted: isSpectator(viewer) ? false : !!myVote,
    votedTargetId: myVote?.targetParticipantId ?? null,
    totalVoters: activePlayers.length,
    votedCount: round.votes.length,
    roundNumber: round.number,
    isSpectator: isSpectator(viewer),
    isImpostor: session.impostorParticipantId === participantId,
  };
}

export async function castImpostorVote(
  sessionCode: string,
  voterParticipantId: string,
  targetParticipantId: string
) {
  const { session, round } = await getActiveRoundFull(sessionCode);

  if (!session || !round) {
    throw new Error("Rodada não encontrada");
  }
  if (round.status !== "voting") {
    throw new Error("Votação não está aberta");
  }

  const voter = session.participants.find((p) => p.id === voterParticipantId);
  if (!voter || isSpectator(voter)) {
    throw new Error("Você não pode votar nesta rodada");
  }

  const target = session.participants.find((p) => p.id === targetParticipantId);
  if (!target || isSpectator(target)) {
    throw new Error("Participante inválido");
  }

  if (targetParticipantId === voterParticipantId) {
    throw new Error("Você não pode votar em si mesmo");
  }

  const existingVote = round.votes.find(
    (vote) => vote.voterParticipantId === voterParticipantId
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

  return getImpostorVoteState(sessionCode, voterParticipantId);
}

async function buildParticipantListsPayload(sessionId: string) {
  const participants = await prisma.participant.findMany({
    where: { sessionId },
    orderBy: { joinedAt: "asc" },
  });

  const lists: ImpostorSessionResult["participantLists"] = {};

  for (const participant of participants) {
    const picks = await aggregateParticipantPicks(sessionId, participant.id, 3);
    lists[participant.id] = {
      displayName: participant.displayName,
      picks: picks.map((pick) => ({
        rank: pick.rank,
        playerName: pick.playerName,
      })),
    };
  }

  return lists;
}

export async function advanceImpostorSession(
  sessionCode: string,
  participantId: string,
  guestToken?: string | null
) {
  await assertCreator(sessionCode, participantId, guestToken);
  const sessionFull = await getSessionOrThrow(sessionCode);

  if (sessionFull.gameMode !== "impostor") {
    throw new Error("Esta sala não é do modo impostor");
  }

  const currentRound = getActiveImpostorRound(sessionFull);
  if (!currentRound && sessionFull.status !== "setup") {
    throw new Error("Rodada não encontrada");
  }

  if (sessionFull.status === "setup") {
    await startImpostorGame(sessionCode, participantId, guestToken);
    return getSessionOrThrow(sessionCode);
  }

  if (sessionFull.status === "completed") {
    throw new Error("Partida já encerrada — veja o resultado final");
  }

  if (sessionFull.status !== "active" || !currentRound) {
    throw new Error(
      `Não foi possível avançar a sala (status: ${sessionFull.status})`
    );
  }

  if (currentRound.number !== sessionFull.currentRoundNumber) {
    await prisma.session.update({
      where: { id: sessionFull.id },
      data: { currentRoundNumber: currentRound.number },
    });
  }

  const roundFull = await prisma.round.findUnique({
    where: { id: currentRound.id },
    include: {
      votes: true,
      picks: true,
      result: true,
    },
  });

  if (!roundFull) {
    throw new Error("Rodada não encontrada");
  }

  const players = getPlayers(sessionFull.participants);

  if (roundFull.status === "open") {
    const allConfirmed = players.every((p) => p.status === "confirmed");
    if (!allConfirmed) {
      throw new Error("Todos precisam escolher uma carta antes de avançar");
    }

    await prisma.round.update({
      where: { id: roundFull.id },
      data: { status: "reveal" },
    });
  } else if (roundFull.status === "reveal") {
    await prisma.round.update({
      where: { id: roundFull.id },
      data: { status: "voting" },
    });
  } else if (roundFull.status === "voting") {
    if (roundFull.votes.length < players.length) {
      throw new Error("Todos os participantes precisam votar antes de encerrar");
    }

    const activeIds = players.map((p) => p.id);
    const { eliminatedId, wasTie } = resolveElimination(
      roundFull.votes,
      activeIds
    );

    const impostorId = sessionFull.impostorParticipantId;
    if (!impostorId) {
      throw new Error("Impostor não definido");
    }

    const outcome = checkImpostorOutcome(
      eliminatedId,
      wasTie,
      impostorId,
      roundFull.number,
      IMPOSTOR_TOTAL_ROUNDS
    );

    const eliminatedParticipant = eliminatedId
      ? sessionFull.participants.find((p) => p.id === eliminatedId)
      : null;

    const elimination: ImpostorElimination = {
      roundNumber: roundFull.number,
      eliminatedParticipantId: eliminatedId,
      eliminatedDisplayName: eliminatedParticipant?.displayName ?? null,
      wasTie,
    };

    const roundResultData = { elimination };

    if (outcome === "crew_win" || outcome === "impostor_win") {
      const themeTitles = collectSessionThemeTitles(sessionFull.rounds);
      const impostor = sessionFull.participants.find(
        (p) => p.id === impostorId
      );

      const priorResults = await prisma.roundResult.findMany({
        where: {
          round: {
            sessionId: sessionFull.id,
            number: { lt: roundFull.number },
          },
        },
        include: { round: true },
        orderBy: { round: { number: "asc" } },
      });

      const eliminations: ImpostorElimination[] = [
        ...priorResults.map((result) => {
          const data = JSON.parse(result.data) as {
            elimination: ImpostorElimination;
          };
          return data.elimination;
        }),
        elimination,
      ];

      const finalResult = buildImpostorSessionResult({
        outcome,
        impostorParticipantId: impostorId,
        impostorDisplayName: impostor?.displayName ?? "Impostor",
        themeTitles,
        eliminations,
        participantLists: await buildParticipantListsPayload(sessionFull.id),
      });

      await prisma.$transaction([
        prisma.round.update({
          where: { id: roundFull.id },
          data: { status: "completed" },
        }),
        prisma.roundResult.upsert({
          where: { roundId: roundFull.id },
          create: {
            roundId: roundFull.id,
            data: JSON.stringify(roundResultData),
          },
          update: { data: JSON.stringify(roundResultData) },
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
        ...(eliminatedId && eliminatedId !== impostorId
          ? [
              prisma.participant.update({
                where: { id: eliminatedId },
                data: { status: "spectator", confirmedAt: null },
              }),
            ]
          : []),
      ]);

      await safeRecordMatch(() =>
        recordImpostorSessionMatch(sessionFull.id, finalResult)
      );
    } else {
      const nextRound = sessionFull.rounds.find(
        (round) => round.number === sessionFull.currentRoundNumber + 1
      );

      let nextRoundSeed:
        | {
            roundId: string;
            theme: NonNullable<ReturnType<typeof getImpostorTheme>>;
            participantIds: string[];
            playersByName: Map<string, { id: string }>;
          }
        | null = null;

      if (nextRound) {
        const nextTheme = resolveImpostorRoundTheme(
          nextRound,
          sessionFull.impostorThemeId
        );
        if (!nextTheme) {
          throw new Error("Tema da próxima rodada inválido");
        }

        const activeParticipants = players.filter(
          (participant) => participant.id !== eliminatedId
        );
        const playersByName = await resolvePlayerIdsByName([
          ...nextTheme.seededPicks.map((pick) => pick.playerName),
          ...nextTheme.pool,
        ]);

        nextRoundSeed = {
          roundId: nextRound.id,
          theme: nextTheme,
          participantIds: activeParticipants.map((participant) => participant.id),
          playersByName,
        };
      }

      await prisma.$transaction(async (tx) => {
        await tx.round.update({
          where: { id: roundFull.id },
          data: { status: "completed" },
        });
        await tx.roundResult.upsert({
          where: { roundId: roundFull.id },
          create: {
            roundId: roundFull.id,
            data: JSON.stringify(roundResultData),
          },
          update: { data: JSON.stringify(roundResultData) },
        });

        if (eliminatedId) {
          await tx.participant.update({
            where: { id: eliminatedId },
            data: { status: "spectator", confirmedAt: null },
          });
        }

        if (nextRound) {
          await tx.session.update({
            where: { id: sessionFull.id },
            data: { currentRoundNumber: nextRound.number },
          });
          await tx.round.update({
            where: { id: nextRound.id },
            data: { status: "open" },
          });
          await tx.participant.updateMany({
            where: {
              sessionId: sessionFull.id,
              status: { not: "spectator" },
            },
            data: { status: "building", confirmedAt: null },
          });

          if (nextRoundSeed) {
            await createRoundSeedPicks(
              nextRoundSeed.roundId,
              nextRoundSeed.theme,
              nextRoundSeed.participantIds,
              nextRoundSeed.playersByName,
              tx
            );
          }
        }
      });
    }
  } else if (roundFull.status === "completed") {
    throw new Error("Rodada já encerrada");
  } else {
    throw new Error("Rodada não está em fase avançável");
  }

  return getSessionOrThrow(sessionCode);
}

export async function restartImpostorSession(
  sessionCode: string,
  participantId: string,
  guestToken?: string | null
) {
  const { session } = await assertCreator(sessionCode, participantId, guestToken);

  if (session.gameMode !== "impostor") {
    throw new Error("Esta sala não é do modo impostor");
  }
  if (session.status !== "completed") {
    throw new Error("Só é possível reiniciar após o jogo terminar");
  }

  await prisma.$transaction([
    prisma.round.deleteMany({ where: { sessionId: session.id } }),
    prisma.sessionResult.deleteMany({ where: { sessionId: session.id } }),
    prisma.participant.updateMany({
      where: { sessionId: session.id },
      data: { status: "building", confirmedAt: null },
    }),
    prisma.session.update({
      where: { id: session.id },
      data: {
        status: "setup",
        currentRoundNumber: 1,
        impostorParticipantId: null,
        impostorThemeId: null,
        title: `Sala ${session.code}`,
      },
    }),
  ]);
}

