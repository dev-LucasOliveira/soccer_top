import { NextResponse } from "next/server";
import { setListaSecretaMpConfig } from "@/lib/lista-secreta-mp-session";

type RouteContext = { params: Promise<{ code: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, guestToken, totalRounds, slotCount, pickTimeLimitSeconds } =
      body as {
      participantId?: string;
      guestToken?: string;
      totalRounds?: number;
      slotCount?: number;
      pickTimeLimitSeconds?: number | null;
    };

    if (
      !participantId ||
      typeof totalRounds !== "number" ||
      typeof slotCount !== "number"
    ) {
      return NextResponse.json(
        { error: "Participante, rodadas e slots são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await setListaSecretaMpConfig(
      code,
      participantId,
      guestToken ?? null,
      totalRounds,
      slotCount,
      pickTimeLimitSeconds ?? null
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("lista-secreta config error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao configurar" },
      { status: 400 }
    );
  }
}
