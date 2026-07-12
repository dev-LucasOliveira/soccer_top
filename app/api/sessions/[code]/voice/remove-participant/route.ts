import { NextResponse } from "next/server";
import { VOICE_DISABLED_MESSAGE } from "@/lib/voice-config";
import { removeVoiceParticipant } from "@/lib/voice-moderation";
import { VoiceDisabledError } from "@/lib/voice-token";

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

    await removeVoiceParticipant({
      sessionCode: code,
      creatorParticipantId: participantId,
      guestToken,
      targetParticipantId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof VoiceDisabledError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          message: VOICE_DISABLED_MESSAGE,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao remover do áudio" },
      { status: 400 }
    );
  }
}
