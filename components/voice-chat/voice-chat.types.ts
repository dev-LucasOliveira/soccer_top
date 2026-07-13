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
export const VOICE_DOCK_COLLAPSED_KEY = "voice-chat-dock-collapsed";
export const VOICE_VOLUME_PREFIX = "voice-volume:";
export const VOICE_CHAT_INSET_CSS_VAR = "--voice-chat-inset";
export const VOICE_CHAT_INSET_MARGIN_PX = 12;

export const GAMEPLAY_VOICE_ROUTE_SUFFIXES = [
  "/vote",
  "/pick",
  "/reveal",
  "/duelo",
  "/lista-secreta",
] as const;

export function isGameplayVoiceRoute(pathname: string): boolean {
  return GAMEPLAY_VOICE_ROUTE_SUFFIXES.some((suffix) =>
    pathname.endsWith(suffix)
  );
}

export function setVoiceChatInset(px: number) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(VOICE_CHAT_INSET_CSS_VAR, `${px}px`);
}

export function clearVoiceChatInset() {
  setVoiceChatInset(0);
}

export function readVoiceChatInset(): number {
  if (typeof document === "undefined") return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    VOICE_CHAT_INSET_CSS_VAR
  );
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

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

export function isTouchPrimaryDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window
  );
}

export function shouldAutoJoinVoice(): boolean {
  if (typeof window === "undefined") return false;
  if (isTouchPrimaryDevice()) return false;
  return localStorage.getItem(VOICE_AUTO_JOIN_KEY) === "true";
}

export function rememberVoiceAutoJoin() {
  if (typeof window === "undefined") return;
  if (isTouchPrimaryDevice()) return;
  localStorage.setItem(VOICE_AUTO_JOIN_KEY, "true");
}

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function getVoiceDockCollapsed(): boolean | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(VOICE_DOCK_COLLAPSED_KEY);
  if (raw === null) return null;
  return raw === "true";
}

export function setVoiceDockCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(VOICE_DOCK_COLLAPSED_KEY, String(collapsed));
}

export function getDefaultVoiceDockCollapsed(): boolean {
  return isMobileViewport();
}
