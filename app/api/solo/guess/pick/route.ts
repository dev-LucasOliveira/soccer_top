import { NextResponse } from "next/server";
import { GUESS_TOP_MAX_ERRORS } from "@/lib/guess-top-challenges";
import {
  applyPick,
  decodeSession,
  getCurrentChallengeId,
  isSessionGameOver,
} from "@/lib/guess-top-session";
import {
  checkPickInRound,
  drawRoundFromChallenge,
  getResolvedChallengeById,
  toPublicRound,
} from "@/lib/guess-top-score";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionToken, playerId } = body as {
      sessionToken?: string;
      playerId?: string;
    };

    if (!sessionToken || !playerId) {
      return NextResponse.json(
        { error: "Sessão e jogador são obrigatórios" },
        { status: 400 }
      );
    }

    const state = decodeSession(sessionToken);
    if (!state) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada" },
        { status: 400 }
      );
    }

    const overBefore = isSessionGameOver(state);
    if (overBefore.gameOver) {
      return NextResponse.json(
        { error: "Sessão já encerrada" },
        { status: 400 }
      );
    }

    const challengeId = getCurrentChallengeId(state);
    if (!challengeId) {
      return NextResponse.json(
        { error: "Rodada inválida" },
        { status: 400 }
      );
    }

    const challenge = await getResolvedChallengeById(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { error: "Desafio não encontrado" },
        { status: 404 }
      );
    }

    const revealed = checkPickInRound(
      challenge,
      state.drawnPlayerIds,
      playerId
    );

    let nextDrawnPlayerIds: string[] | undefined;
    if (revealed) {
      const wouldReveal = [...state.revealedPlayerIds, playerId];
      if (wouldReveal.length >= 5) {
        const nextChallengeId =
          state.challengeOrder[state.roundIndex + 1] ?? null;
        if (nextChallengeId) {
          const nextChallenge = await getResolvedChallengeById(nextChallengeId);
          if (nextChallenge) {
            nextDrawnPlayerIds = drawRoundFromChallenge(nextChallenge);
          }
        }
      }
    }

    const result = applyPick(state, playerId, revealed, nextDrawnPlayerIds);

    if (result.kind === "duplicate") {
      return NextResponse.json({
        duplicate: true,
        sessionToken: result.token,
        errorsUsed: state.errorsUsed,
        topsCompleted: state.topsCompleted,
        maxErrors: GUESS_TOP_MAX_ERRORS,
        gameOver: false,
      });
    }

    if (result.kind === "wrong") {
      const finalRoundReveal = result.gameOver
        ? toPublicRound(challenge, state.drawnPlayerIds, state.drawnPlayerIds)
        : undefined;

      return NextResponse.json({
        correct: false,
        sessionToken: result.token,
        errorsUsed: result.errorsUsed,
        errorsRemaining: GUESS_TOP_MAX_ERRORS - result.errorsUsed,
        topsCompleted: state.topsCompleted,
        maxErrors: GUESS_TOP_MAX_ERRORS,
        gameOver: result.gameOver,
        reason: result.reason,
        finalRoundReveal,
      });
    }

    const nextChallengeId = getCurrentChallengeId(result.state);
    const nextRound =
      nextChallengeId && result.roundComplete && !result.gameOver
        ? toPublicRound(
            (await getResolvedChallengeById(nextChallengeId))!,
            result.state.drawnPlayerIds,
            []
          )
        : null;

    const finalRoundReveal =
      result.gameOver && result.roundComplete
        ? toPublicRound(challenge, state.drawnPlayerIds, state.drawnPlayerIds)
        : undefined;

    return NextResponse.json({
      correct: true,
      sessionToken: result.token,
      revealed: result.revealed,
      roundComplete: result.roundComplete,
      topsCompleted: result.topsCompleted,
      errorsUsed: result.state.errorsUsed,
      errorsRemaining: GUESS_TOP_MAX_ERRORS - result.state.errorsUsed,
      maxErrors: GUESS_TOP_MAX_ERRORS,
      gameOver: result.gameOver,
      reason: result.reason,
      nextRound,
      roundIndex: result.state.roundIndex,
      totalRounds: result.state.challengeOrder.length,
      finalRoundReveal,
    });
  } catch (error) {
    console.error("guess pick error:", error);
    return NextResponse.json(
      { error: "Erro ao processar palpite" },
      { status: 500 }
    );
  }
}
