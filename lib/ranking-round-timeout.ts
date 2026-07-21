import { prisma } from "@/lib/db";
import { getPlayers } from "@/lib/participants";
import { getCurrentRound } from "@/lib/round";
import { isTurnExpired } from "@/lib/pick-time-limit";

export async function applyRankingRoundTimeout(sessionCode: string) {
  const session = await prisma.session.findUnique({
    where: { code: sessionCode },
    include: {
      participants: { orderBy: { joinedAt: "asc" } },
      rounds: { orderBy: { number: "asc" } },
    },
  });

  if (!session) {
    throw new Error("Sala não encontrada");
  }

  if (session.gameMode !== "ranking") {
    throw new Error("Esta sala não é do modo tradicional");
  }

  if (session.status !== "active") {
    throw new Error("A partida não está ativa");
  }

  const currentRound = getCurrentRound(session);
  if (!currentRound || currentRound.status !== "open") {
    throw new Error("Rodada não está aberta");
  }

  const roundFull = await prisma.round.findUnique({
    where: { id: currentRound.id },
  });

  if (!roundFull?.pickTimeLimitSeconds || !roundFull.openedAt) {
    throw new Error("Esta rodada não tem limite de tempo");
  }

  if (
    !isTurnExpired(
      roundFull.openedAt.toISOString(),
      roundFull.pickTimeLimitSeconds
    )
  ) {
    throw new Error("O tempo da rodada ainda não acabou");
  }

  const players = getPlayers(session.participants);
  const unconfirmed = players.filter((player) => player.status !== "confirmed");

  if (unconfirmed.length === 0) {
    return { confirmedCount: 0, alreadyHandled: true };
  }

  await prisma.participant.updateMany({
    where: {
      id: { in: unconfirmed.map((player) => player.id) },
    },
    data: {
      status: "confirmed",
      confirmedAt: new Date(),
    },
  });

  return { confirmedCount: unconfirmed.length, alreadyHandled: false };
}
