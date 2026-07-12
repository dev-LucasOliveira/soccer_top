"use client";

import {
  Headphones,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeviceSelector } from "./device-selector";
import { ParticipantVolumeControls } from "./participant-volume";
import { canAccessMicrophone, getInsecureContextError } from "./voice-chat.service";
import { useVoiceChat } from "./voice-chat-provider";
import { VoiceParticipants } from "./voice-participants";
import { VoiceUnavailableBanner } from "./voice-unavailable-banner";

function statusLabel(status: string) {
  switch (status) {
    case "requesting-permission":
      return "Pedindo permissão do microfone...";
    case "connecting":
      return "Conectando ao áudio...";
    case "reconnecting":
      return "Reconectando ao áudio...";
    case "connected":
      return "No áudio";
    case "error":
      return "Erro no áudio";
    case "unavailable":
      return "Voice chat fora do ar";
    default:
      return "Áudio disponível";
  }
}

export function VoiceChatControls() {
  const {
    status,
    availability,
    canJoin,
    joinVoice,
    leaveVoice,
    toggleMicrophone,
    isMicrophoneEnabled,
    error,
    participants,
  } = useVoiceChat();

  const isConnected = status === "connected" || status === "reconnecting";
  const isBusy =
    status === "connecting" ||
    status === "requesting-permission" ||
    status === "reconnecting";
  const micUnavailable = !canAccessMicrophone();
  const insecureContextMessage = getInsecureContextError().message;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex w-[min(100vw-2rem,22rem)] flex-col gap-2">
      <div className="pointer-events-auto">
        <VoiceUnavailableBanner />
      </div>

      <div className="pointer-events-auto rounded-2xl border border-off-white/10 bg-pitch/90 p-3 shadow-2xl backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/15 p-2 text-gold-light">
              {isConnected ? (
                <Radio size={16} aria-hidden />
              ) : (
                <Headphones size={16} aria-hidden />
              )}
            </span>
            <div>
              <p className="text-sm font-medium text-off-white">Voice chat</p>
              <p
                className={cn(
                  "text-xs",
                  status === "error" ? "text-red-300" : "text-on-pitch-subtle"
                )}
              >
                {statusLabel(status)}
              </p>
            </div>
          </div>
          {isBusy && <Loader2 size={16} className="animate-spin text-gold-light" />}
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-200">
            {error.message}
          </p>
        )}

        {micUnavailable && !error && (
          <p className="mb-3 rounded-lg bg-gold/10 px-2 py-1.5 text-xs text-gold-light">
            {insecureContextMessage}
          </p>
        )}

        {!availability.enabled ? (
          <p className="text-xs text-on-pitch-subtle">
            O voice chat está temporariamente indisponível.
          </p>
        ) : !isConnected ? (
          <Button
            type="button"
            variant="gold"
            size="sm"
            className="w-full"
            disabled={!canJoin || isBusy || micUnavailable}
            onClick={() => void joinVoice()}
          >
            <Mic size={14} className="mr-2" aria-hidden />
            Entrar no áudio
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isMicrophoneEnabled ? "secondary" : "gold"}
                size="sm"
                className="flex-1"
                onClick={() => void toggleMicrophone()}
              >
                {isMicrophoneEnabled ? (
                  <>
                    <Mic size={14} className="mr-2" aria-hidden />
                    Mutar
                  </>
                ) : (
                  <>
                    <MicOff size={14} className="mr-2" aria-hidden />
                    Ativar mic
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void leaveVoice()}
              >
                <PhoneOff size={14} aria-hidden />
              </Button>
            </div>

            <VoiceParticipants />
            <DeviceSelector />
            {participants.some((participant) => !participant.isLocal) && (
              <ParticipantVolumeControls />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
