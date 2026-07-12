import { NextResponse } from "next/server";
import { setDueloConfig } from "@/lib/duelo-session";

type RouteContext = { params: Promise<{ code: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, guestToken, totalRounds, pickTimeLimitSeconds } = body as {
      participantId?: string;
      guestToken?: string;
      totalRounds?: number;
      pickTimeLimitSeconds?: number | null;
    };

    if (!participantId || typeof totalRounds !== "number") {
      return NextResponse.json(
        { error: "Participante e número de rodadas são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await setDueloConfig(
      code,
      participantId,
      guestToken ?? null,
      totalRounds,
      pickTimeLimitSeconds ?? null
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("duelo config error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao configurar" },
      { status: 400 }
    );
  }
}
