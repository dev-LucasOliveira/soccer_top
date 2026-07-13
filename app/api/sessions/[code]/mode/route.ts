import { NextResponse } from "next/server";
import { setSessionGameMode } from "@/lib/session";
import { isPlayableGameMode } from "@/lib/mode-constraints";
import type { PlayableGameMode } from "@/lib/types";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { gameMode, participantId, guestToken } = body as {
      gameMode: string;
      participantId: string;
      guestToken?: string;
    };

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId é obrigatório" },
        { status: 400 }
      );
    }

    if (!isPlayableGameMode(gameMode)) {
      return NextResponse.json(
        { error: "Modo de jogo inválido" },
        { status: 400 }
      );
    }

    await setSessionGameMode(
      code,
      participantId,
      guestToken,
      gameMode as PlayableGameMode
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao escolher modo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
