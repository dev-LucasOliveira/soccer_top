import { NextResponse } from "next/server";
import { removeSessionParticipant } from "@/lib/session-moderation";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, guestToken, targetParticipantId } = body as {
      participantId?: string;
      guestToken?: string;
      targetParticipantId?: string;
    };

    if (!participantId || !guestToken || !targetParticipantId) {
      return NextResponse.json(
        { error: "participantId, guestToken e targetParticipantId são obrigatórios" },
        { status: 400 }
      );
    }

    await removeSessionParticipant({
      sessionCode: code,
      creatorParticipantId: participantId,
      guestToken,
      targetParticipantId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao remover participante";

    const status =
      message === "Não autorizado" ||
      message === "Apenas o criador pode realizar esta ação"
        ? 403
        : message === "Sala não encontrada" ||
            message === "Participante não encontrado"
          ? 404
          : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
