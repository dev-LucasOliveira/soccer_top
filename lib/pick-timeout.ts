import { prisma } from "@/lib/db";
import { getCurrentRound } from "@/lib/round";
import { isTurnExpired } from "@/lib/pick-time-limit";
import { applyDueloTimeout, parseDueloPayload } from "@/lib/duelo-session";
import {
  applyListaSecretaMpTimeout,
  parseListaSecretaMpPayload,
} from "@/lib/lista-secreta-mp-session";

export async function processExpiredTurnIfNeeded(sessionCode: string): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { code: sessionCode },
    include: {
      participants: { orderBy: { joinedAt: "asc" } },
      rounds: { orderBy: { number: "asc" } },
      result: true,
    },
  });

  if (!session || session.status !== "active" || !session.pickTimeLimitSeconds) {
    return;
  }

  const currentRound = getCurrentRound(session);
  if (!currentRound || currentRound.status !== "open") {
    return;
  }

  if (session.gameMode === "duelo") {
    const payload = parseDueloPayload(currentRound.cardOptions);
    if (!payload || payload.phase !== "open") {
      return;
    }

    if (
      !isTurnExpired(payload.turnStartedAt, session.pickTimeLimitSeconds)
    ) {
      return;
    }

    await applyDueloTimeout(sessionCode, payload.activeParticipantId);
    return;
  }

  if (session.gameMode === "lista-secreta-mp") {
    const payload = parseListaSecretaMpPayload(currentRound.cardOptions);
    if (!payload || payload.phase !== "open") {
      return;
    }

    if (
      !isTurnExpired(payload.turnStartedAt, session.pickTimeLimitSeconds)
    ) {
      return;
    }

    await applyListaSecretaMpTimeout(sessionCode, payload.activeParticipantId);
  }
}
