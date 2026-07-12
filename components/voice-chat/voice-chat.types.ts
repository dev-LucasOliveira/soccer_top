import type { VoiceDisabledMessage } from "@/lib/voice-config";

export type VoiceConnectionStatus =
  | "idle"
  | "requesting-permission"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error"
  | "unavailable";

export type VoiceChatErrorCode =
  | "permission_denied"
  | "no_device"
  | "device_busy"
  | "device_missing"
  | "insecure_context"
  | "voice_disabled"
  | "token_failed"
  | "connection_failed"
  | "unknown";

export type VoiceChatError = {
  code: VoiceChatErrorCode;
  message: string;
};

export type VoiceParticipant = {
  id: string;
  name: string;
  isLocal: boolean;
  isSpeaking: boolean;
  isMicrophoneEnabled: boolean;
  canPublish: boolean;
  volume: number;
  isLocallyMuted: boolean;
};

export type VoiceAvailability = {
  enabled: boolean;
  message?: VoiceDisabledMessage;
};

export type VoiceTokenResponse = {
  token: string;
  url: string;
  roomName: string;
  canPublish: boolean;
};

export const VOICE_AUTO_JOIN_KEY = "voice-chat-auto-join";
export const VOICE_VOLUME_PREFIX = "voice-volume:";

export function getStoredParticipantVolume(participantId: string): number {
  if (typeof window === "undefined") return 1;
  const raw = localStorage.getItem(`${VOICE_VOLUME_PREFIX}${participantId}`);
  if (!raw) return 1;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
}

export function setStoredParticipantVolume(participantId: string, volume: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${VOICE_VOLUME_PREFIX}${participantId}`,
    String(Math.min(1, Math.max(0, volume)))
  );
}

export function shouldAutoJoinVoice(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(VOICE_AUTO_JOIN_KEY) === "true";
}

export function rememberVoiceAutoJoin() {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOICE_AUTO_JOIN_KEY, "true");
}
