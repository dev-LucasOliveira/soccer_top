import { NextResponse } from "next/server";
import {
  getImpostorView,
  setImpostorTheme,
} from "@/lib/impostor-session";
import { listImpostorThemes } from "@/lib/impostor-themes";

type RouteContext = { params: Promise<{ code: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("participantId");

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId é obrigatório" },
        { status: 400 }
      );
    }

    const state = await getImpostorView(code, participantId);
    return NextResponse.json(state);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar estado do jogo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, guestToken, themeId } = body as {
      participantId: string;
      guestToken?: string;
      themeId: string;
    };

    if (!participantId || !themeId) {
      return NextResponse.json(
        { error: "participantId e themeId são obrigatórios" },
        { status: 400 }
      );
    }

    await setImpostorTheme(code, participantId, guestToken, themeId);

    return NextResponse.json({
      success: true,
      themes: listImpostorThemes(),
      themeId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao definir tema";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
