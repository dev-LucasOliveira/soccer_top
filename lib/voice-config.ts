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

export function getLiveKitUrl(): string {
  const url = process.env.LIVEKIT_URL;
  if (!url) {
    throw new Error("LIVEKIT_URL não configurada");
  }
  return url;
}

export function getLiveKitCredentials(): { apiKey: string; apiSecret: string } {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("Credenciais LiveKit não configuradas");
  }
  return { apiKey, apiSecret };
}

export function buildVoiceRoomName(sessionCode: string): string {
  return `game_${sessionCode}`;
}
