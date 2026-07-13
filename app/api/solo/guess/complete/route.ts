import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordSoloGuessTopMatch } from "@/lib/match-recording";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ recorded: false });
    }

    const body = await request.json();
    const { topsCompleted, errorsUsed, reason } = body as {
      topsCompleted?: number;
      errorsUsed?: number;
      reason?: string;
    };

    if (
      typeof topsCompleted !== "number" ||
      typeof errorsUsed !== "number" ||
      !reason
    ) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    await recordSoloGuessTopMatch(user.id, {
      topsCompleted,
      errorsUsed,
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
