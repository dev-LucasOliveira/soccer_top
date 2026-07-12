export type VoiceDisabledMessage = {
  title: string;
  body: string;
  ctaLabel: string;
  discordHint: string;
};

export function isVoiceChatEnabled(): boolean {
  return process.env.VOICE_CHAT_ENABLED !== "false";
}

export const VOICE_DISABLED_MESSAGE: VoiceDisabledMessage = {
  title: "Voice chat de folga",
  body: "Vocês falam pra caraca — nosso sistema de voice chat tá fora do ar, mané. Tenta depois. Por enquanto, recomendamos usar o Discord pras discussões.",
  ctaLabel: "Beleza, entendi",
  discordHint: "Cria um server, manda o link no chat e segue o jogo por aqui.",
};

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getVoiceConfigStatus() {
  return {
    enabled: isVoiceChatEnabled(),
    hasApiKey: Boolean(readEnv("LIVEKIT_API_KEY")),
    hasApiSecret: Boolean(readEnv("LIVEKIT_API_SECRET")),
    hasUrl: Boolean(readEnv("LIVEKIT_URL")),
  };
}

export function getLiveKitUrl(): string {
  const url = readEnv("LIVEKIT_URL");
  if (!url) {
    throw new Error("LIVEKIT_URL não configurada");
  }
  return url;
}

export function getLiveKitCredentials(): { apiKey: string; apiSecret: string } {
  const apiKey = readEnv("LIVEKIT_API_KEY");
  const apiSecret = readEnv("LIVEKIT_API_SECRET");
  if (!apiKey && !apiSecret) {
    throw new Error("Credenciais LiveKit não configuradas");
  }
  if (!apiKey) {
    throw new Error("LIVEKIT_API_KEY não configurada");
  }
  if (!apiSecret) {
    throw new Error("LIVEKIT_API_SECRET não configurada");
  }
  return { apiKey, apiSecret };
}

export function buildVoiceRoomName(sessionCode: string): string {
  return `game_${sessionCode}`;
}
