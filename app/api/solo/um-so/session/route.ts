import { NextResponse } from "next/server";
import {
  drawSecretPlayerId,
  getUmSoChallengeById,
  pickRandomChallengeId,
  toPublicRound,
} from "@/lib/um-so-score";
import { createUmSoSession } from "@/lib/um-so-session";

export async function POST() {
  try {
    const challengeId = pickRandomChallengeId();
    const challenge = await getUmSoChallengeById(challengeId);

    if (!challenge) {
      return NextResponse.json(
        { error: "Nenhum desafio disponível" },
        { status: 500 }
      );
    }

    const secretPlayerId = drawSecretPlayerId(challenge);
    const { token, state } = createUmSoSession(challengeId, secretPlayerId);

    return NextResponse.json({
      sessionToken: token,
      score: 0,
      streak: 0,
      roundsCompleted: 0,
      currentRound: toPublicRound(challenge, secretPlayerId, 0),
      attemptedPlayerIds: [],
      gameOver: false,
    });
  } catch (error) {
    console.error("um-so session error:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar sessão" },
      { status: 500 }
    );
  }
}
