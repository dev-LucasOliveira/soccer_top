import { NextResponse } from "next/server";
import { advanceSession } from "@/lib/session";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, guestToken } = body as {
      participantId: string;
      guestToken?: string;
    };

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId é obrigatório" },
        { status: 400 }
      );
    }

    await advanceSession(code, participantId, guestToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao avançar fase";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
