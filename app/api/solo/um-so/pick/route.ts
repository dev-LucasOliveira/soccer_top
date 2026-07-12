import { NextResponse } from "next/server";
import { calculateRoundPoints } from "@/lib/um-so-score-calc";
import {
  buildPlayerHintLadder,
  checkSecretPick,
  drawSecretPlayerId,
  getSecretPlayer,
  getUmSoChallengeById,
  pickRandomChallengeId,
  toPublicRound,
} from "@/lib/um-so-score";
import { applyUmSoPick, decodeUmSoSession } from "@/lib/um-so-session";

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

    const state = decodeUmSoSession(sessionToken);
    if (!state) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada" },
        { status: 400 }
      );
    }

    const challenge = await getUmSoChallengeById(state.challengeId);
    if (!challenge) {
      return NextResponse.json(
        { error: "Desafio não encontrado" },
        { status: 404 }
      );
    }

    const secretPlayer = getSecretPlayer(challenge, state.secretPlayerId);
    if (!secretPlayer) {
      return NextResponse.json(
        { error: "Jogador secreto inválido" },
        { status: 500 }
      );
    }

    const ladder = buildPlayerHintLadder(secretPlayer, challenge);
    const isCorrect = checkSecretPick(
      challenge,
      state.secretPlayerId,
      playerId
    );

    let nextRound:
      | { challengeId: string; secretPlayerId: string }
      | undefined;

    if (isCorrect) {
      const nextChallengeId = pickRandomChallengeId();
      const nextChallenge = await getUmSoChallengeById(nextChallengeId);
      if (nextChallenge) {
        nextRound = {
          challengeId: nextChallengeId,
          secretPlayerId: drawSecretPlayerId(nextChallenge),
        };
      }
    }

    const roundPoints = isCorrect
      ? calculateRoundPoints(state.hintsRevealed, state.streak + 1).points
      : 0;

    const result = applyUmSoPick(
      state,
      playerId,
      isCorrect,
      roundPoints,
      ladder.length,
      nextRound
    );

    if (result.kind === "duplicate") {
      return NextResponse.json({
        duplicate: true,
        sessionToken: result.token,
        score: state.score,
        streak: state.streak,
        hintsRevealed: state.hintsRevealed,
        gameOver: false,
      });
    }

    if (result.kind === "wrong") {
      const newHint =
        result.revealedNewHint && result.hintsRevealed > 0
          ? ladder[result.hintsRevealed - 1]
          : null;

      const secretReveal = result.gameOver
        ? {
            playerId: secretPlayer.playerId,
            playerName: secretPlayer.playerName,
            nationality: secretPlayer.nationality,
            position: secretPlayer.position,
          }
        : undefined;

      return NextResponse.json({
        correct: false,
        sessionToken: result.token,
        hintsRevealed: result.hintsRevealed,
        totalHints: ladder.length,
        newHint,
        hints: ladder.slice(0, result.hintsRevealed),
        score: state.score,
        streak: state.streak,
        bestStreak: state.bestStreak,
        roundsCompleted: state.roundsCompleted,
        gameOver: result.gameOver,
        reason: result.reason,
        secretReveal,
        atLastHint: result.hintsRevealed >= ladder.length,
      });
    }

    const scoring = calculateRoundPoints(result.hintsUsed, result.streak);

    let nextPublicRound = null;
    if (result.nextChallengeId && result.nextSecretPlayerId) {
      const nextChallenge = await getUmSoChallengeById(result.nextChallengeId);
      if (nextChallenge) {
        nextPublicRound = toPublicRound(
          nextChallenge,
          result.nextSecretPlayerId,
          0
        );
      }
    }

    return NextResponse.json({
      correct: true,
      sessionToken: result.token,
      hintsUsed: result.hintsUsed,
      roundPoints: result.roundPoints,
      tier: scoring.tier,
      tierLabel: scoring.tierLabel,
      score: result.state.score,
      streak: result.streak,
      bestStreak: result.state.bestStreak,
      roundsCompleted: result.state.roundsCompleted,
      gameOver: false,
      nextRound: nextPublicRound,
      secretPlayer: {
        playerId: secretPlayer.playerId,
        playerName: secretPlayer.playerName,
        nationality: secretPlayer.nationality,
        position: secretPlayer.position,
      },
    });
  } catch (error) {
    console.error("um-so pick error:", error);
    return NextResponse.json(
      { error: "Erro ao processar palpite" },
      { status: 500 }
    );
  }
}
