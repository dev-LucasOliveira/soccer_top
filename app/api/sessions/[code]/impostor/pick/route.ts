import { NextResponse } from "next/server";
import { submitImpostorPick } from "@/lib/impostor-session";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, playerId } = body as {
      participantId: string;
      playerId: string;
    };

    if (!participantId || !playerId) {
      return NextResponse.json(
        { error: "participantId e playerId são obrigatórios" },
        { status: 400 }
      );
    }

    const state = await submitImpostorPick(code, participantId, playerId);
    return NextResponse.json(state);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao registrar escolha";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
