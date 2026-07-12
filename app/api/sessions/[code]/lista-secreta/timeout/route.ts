import { NextResponse } from "next/server";
import { applyListaSecretaMpTimeout } from "@/lib/lista-secreta-mp-session";

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

    const result = await applyListaSecretaMpTimeout(
      code,
      participantId,
      guestToken ?? null
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("lista-secreta timeout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao processar timeout" },
      { status: 400 }
    );
  }
}
