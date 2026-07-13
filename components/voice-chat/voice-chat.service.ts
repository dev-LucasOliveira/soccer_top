import type {
  VoiceAvailability,
  VoiceChatError,
  VoiceTokenResponse,
} from "./voice-chat.types";
import { isTouchPrimaryDevice } from "./voice-chat.types";

const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export async function requestMicrophonePermission(): Promise<MediaStream> {
  if (!canAccessMicrophone()) {
    throw Object.assign(new Error(getInsecureContextError().message), {
      voiceError: getInsecureContextError(),
    });
  }

  return navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
}

export function releaseMicrophoneStream(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop());
}

export async function fetchVoiceAvailability(): Promise<VoiceAvailability> {
  const res = await fetch("/api/voice/status");
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Erro ao verificar voice chat");
  }
  return data as VoiceAvailability;
}

export async function fetchVoiceToken(
  sessionCode: string,
  participantId: string,
  guestToken: string
): Promise<VoiceTokenResponse> {
  const res = await fetch(`/api/sessions/${sessionCode}/voice-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantId, guestToken }),
  });
  const data = await res.json();

  if (!res.ok) {
    const error: VoiceChatError = {
      code:
        data.code === "voice_disabled"
          ? "voice_disabled"
          : res.status === 403
            ? "token_failed"
            : "token_failed",
      message: data.error ?? "Não foi possível entrar no áudio",
    };
    throw Object.assign(new Error(error.message), { voiceError: error, payload: data });
  }

  return data as VoiceTokenResponse;
}

export function canAccessMicrophone(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

export function getInsecureContextError(): VoiceChatError {
  return {
    code: "insecure_context",
    message:
      "Microfone indisponível em HTTP pelo IP da rede. Use https://semcriterio.vercel.app ou localhost no Mac.",
  };
}

export function mapMediaError(error: unknown): VoiceChatError {
  if (!canAccessMicrophone()) {
    return getInsecureContextError();
  }

  if (error instanceof TypeError) {
    return getInsecureContextError();
  }

  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return {
        code: "permission_denied",
        message: isTouchPrimaryDevice()
          ? "Permissão do microfone negada. Toque em Entrar no áudio e escolha Permitir — ou libere em Ajustes → Safari → Microfone."
          : "Permissão do microfone negada.",
      };
    }
    if (error.name === "NotFoundError") {
      return {
        code: "no_device",
        message: "Nenhum microfone encontrado.",
      };
    }
    if (error.name === "NotReadableError") {
      return {
        code: "device_busy",
        message: "Microfone indisponível ou em uso por outro app.",
      };
    }
    if (error.name === "OverconstrainedError") {
      return {
        code: "device_missing",
        message: "O dispositivo selecionado não está mais disponível.",
      };
    }
  }

  return {
    code: "unknown",
    message: error instanceof Error ? error.message : "Erro de áudio desconhecido",
  };
}
