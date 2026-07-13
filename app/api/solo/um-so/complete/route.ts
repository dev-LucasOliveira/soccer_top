import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordSoloUmSoMatch } from "@/lib/match-recording";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ recorded: false });
    }

    const body = await request.json();
    const { score, bestStreak, roundsCompleted, reason } = body as {
      score?: number;
      bestStreak?: number;
      roundsCompleted?: number;
      reason?: string;
    };

    if (
      typeof score !== "number" ||
      typeof bestStreak !== "number" ||
      typeof roundsCompleted !== "number" ||
      !reason
    ) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    await recordSoloUmSoMatch(user.id, {
      score,
      bestStreak,
      roundsCompleted,
      reason,
    });

    return NextResponse.json({ recorded: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao registrar partida" },
      { status: 500 }
    );
  }
}
