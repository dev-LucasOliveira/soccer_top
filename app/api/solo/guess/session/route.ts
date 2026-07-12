import { NextResponse } from "next/server";
import {
  GUESS_TOP_CHALLENGES,
  GUESS_TOP_MAX_ERRORS,
  shuffleChallengeIds,
} from "@/lib/guess-top-challenges";
import {
  createGuessTopSession,
  getCurrentChallengeId,
} from "@/lib/guess-top-session";
import {
  drawRoundFromChallenge,
  getResolvedChallengeById,
  toPublicRound,
} from "@/lib/guess-top-score";

export async function POST() {
  try {
    const challengeIds = GUESS_TOP_CHALLENGES.map((c) => c.id);
    const challengeOrder = shuffleChallengeIds(challengeIds);
    const firstChallenge = await getResolvedChallengeById(challengeOrder[0]!);

    if (!firstChallenge) {
      return NextResponse.json(
        { error: "Nenhum desafio disponível" },
        { status: 500 }
      );
    }

    const initialDraw = drawRoundFromChallenge(firstChallenge);
    const { token, state } = createGuessTopSession(
      challengeIds,
      initialDraw,
      challengeOrder
    );

    const currentId = getCurrentChallengeId(state);
    if (!currentId) {
      return NextResponse.json(
        { error: "Nenhum desafio disponível" },
        { status: 500 }
      );
    }

    const current = await getResolvedChallengeById(currentId);
    if (!current) {
      return NextResponse.json(
        { error: "Desafio não encontrado" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionToken: token,
      maxErrors: GUESS_TOP_MAX_ERRORS,
      errorsUsed: 0,
      topsCompleted: 0,
      roundIndex: 0,
      totalRounds: state.challengeOrder.length,
      currentRound: toPublicRound(current, state.drawnPlayerIds, []),
      revealedSlots: [],
      attemptedPlayerIds: [],
      gameOver: false,
    });
  } catch (error) {
    console.error("guess session error:", error);
    return NextResponse.json(
      { error: "Erro ao iniciar sessão" },
      { status: 500 }
    );
  }
}
