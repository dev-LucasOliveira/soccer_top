import { NextResponse } from "next/server";
import { VOICE_DISABLED_MESSAGE } from "@/lib/voice-config";
import { logVoiceEvent } from "@/lib/voice-logger";
import { checkVoiceTokenRateLimit } from "@/lib/voice-rate-limit";
import { createVoiceToken, VoiceDisabledError } from "@/lib/voice-token";

type RouteContext = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const { participantId, guestToken } = body as {
      participantId?: string;
      guestToken?: string;
    };

    if (!participantId || !guestToken) {
      return NextResponse.json(
        { error: "participantId e guestToken são obrigatórios" },
        { status: 400 }
      );
    }

    const rateLimitKey = `${code}:${participantId}`;
    const rateLimit = checkVoiceTokenRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      logVoiceEvent("voice_token_denied", {
        sessionCode: code,
        participantId,
        reason: "rate_limit",
      });
      return NextResponse.json(
        { error: "Muitas solicitações — tente novamente em instantes" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimit.retryAfterMs ?? 60_000) / 1000)
            ),
          },
        }
      );
    }

    logVoiceEvent("voice_token_requested", {
      sessionCode: code,
      participantId,
    });

    const result = await createVoiceToken({
      sessionCode: code,
      participantId,
      guestToken,
    });

    return NextResponse.json(result);
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

    logVoiceEvent("voice_token_failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });

    const message = error instanceof Error ? error.message : "Erro ao gerar token";
    const status =
      message === "Não autorizado" ||
      message === "Participante não pertence a esta sala"
        ? 403
        : message === "Sala não encontrada"
          ? 404
          : 400;

    if (status === 403) {
      logVoiceEvent("voice_token_denied", { reason: message });
    }

    return NextResponse.json({ error: message }, { status });
  }
}
