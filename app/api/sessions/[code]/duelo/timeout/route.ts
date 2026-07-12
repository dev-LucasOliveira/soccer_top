import { NextResponse } from "next/server";
import { applyDueloTimeout } from "@/lib/duelo-session";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, guestToken } = body as {
      participantId?: string;
      guestToken?: string;
    };

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId é obrigatório" },
        { status: 400 }
      );
    }

    const result = await applyDueloTimeout(
      code,
      participantId,
      guestToken ?? null
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("duelo timeout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao processar timeout" },
      { status: 400 }
    );
  }
}
