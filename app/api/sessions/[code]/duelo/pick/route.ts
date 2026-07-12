import { NextResponse } from "next/server";
import { applyDueloPick } from "@/lib/duelo-session";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, guestToken, playerId } = body as {
      participantId?: string;
      guestToken?: string;
      playerId?: string;
    };

    if (!participantId || !playerId) {
      return NextResponse.json(
        { error: "Participante e jogador são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await applyDueloPick(
      code,
      participantId,
      guestToken ?? null,
      playerId
    );

    if (result.kind === "duplicate") {
      return NextResponse.json({
        duplicate: true,
        view: result.view,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("duelo pick error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao palpitar" },
      { status: 400 }
    );
  }
}
