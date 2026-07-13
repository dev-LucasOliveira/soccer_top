"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
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
import {
  clearVoiceChatInset,
  getDefaultVoiceDockCollapsed,
  getVoiceDockCollapsed,
  isGameplayVoiceRoute,
  isTouchPrimaryDevice,
  setVoiceChatInset,
  setVoiceDockCollapsed,
  VOICE_CHAT_INSET_MARGIN_PX,
} from "./voice-chat.types";

function statusLabel(status: string, isMicrophoneEnabled: boolean) {
  switch (status) {
    case "requesting-permission":
      return "Pedindo permissão do microfone...";
    case "connecting":
      return "Conectando ao áudio...";
    case "reconnecting":
      return "Reconectando ao áudio...";
    case "connected":
      return isMicrophoneEnabled ? "No áudio" : "Mutado";
    case "error":
      return "Erro no áudio";
    case "unavailable":
      return "Voice chat fora do ar";
    default:
      return "Áudio disponível";
  }
}

function shortStatusLabel(status: string, isMicrophoneEnabled: boolean) {
  switch (status) {
    case "reconnecting":
      return "Reconectando...";
    case "connected":
      return isMicrophoneEnabled ? "No áudio" : "Mutado";
    default:
      return statusLabel(status, isMicrophoneEnabled);
  }
}

export function VoiceChatControls() {
  const pathname = usePathname();
  const dockRef = useRef<HTMLDivElement>(null);
  const {
    status,
    availability,
    canJoin,
    joinDisabledReason,
    joinVoice,
    leaveVoice,
    toggleMicrophone,
    isMicrophoneEnabled,
    error,
    participants,
  } = useVoiceChat();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return getVoiceDockCollapsed() ?? getDefaultVoiceDockCollapsed();
  });

  const isConnected = status === "connected" || status === "reconnecting";
  const isBusy =
    status === "connecting" ||
    status === "requesting-permission" ||
    status === "reconnecting";
  const micUnavailable = !canAccessMicrophone();
  const insecureContextMessage = getInsecureContextError().message;
  const someoneSpeaking = participants.some((participant) => participant.isSpeaking);
  const forceExpanded = Boolean(error) || !availability.enabled || status === "error";
  const showCollapsed = isConnected && isCollapsed && !forceExpanded;

  useEffect(() => {
    if (!isGameplayVoiceRoute(pathname)) return;
    setIsCollapsed(true);
    setVoiceDockCollapsed(true);
  }, [pathname]);

  useEffect(() => {
    const element = dockRef.current;
    if (!element) return;

    function syncInset() {
      const height = element?.getBoundingClientRect().height ?? 0;
      setVoiceChatInset(height > 0 ? height + VOICE_CHAT_INSET_MARGIN_PX : 0);
    }

    syncInset();

    const observer = new ResizeObserver(syncInset);
    observer.observe(element);

    return () => {
      observer.disconnect();
      clearVoiceChatInset();
    };
  }, [showCollapsed, forceExpanded, availability.enabled, status, error]);

  function expandDock() {
    setIsCollapsed(false);
    setVoiceDockCollapsed(false);
  }

  function collapseDock() {
    setIsCollapsed(true);
    setVoiceDockCollapsed(true);
  }

  const dockPositionClass = showCollapsed
    ? "fixed bottom-3 right-3 left-auto z-40 w-auto md:right-4"
    : "fixed bottom-4 right-3 left-auto z-40 flex w-[min(100vw-1.5rem,22rem)] flex-col gap-2 md:right-4";

  return (
    <div ref={dockRef} className={cn("pointer-events-none", dockPositionClass)}>
      <div className="pointer-events-auto mb-2 md:mb-0">
        <VoiceUnavailableBanner />
      </div>

      {showCollapsed ? (
        <div
          className="pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-2xl border border-off-white/10 bg-pitch/90 px-3 py-2.5 shadow-2xl backdrop-blur-md"
          role="region"
          aria-label="Voice chat minimizado"
        >
          <span
            className={cn(
              "relative shrink-0 rounded-full bg-gold/15 p-2 text-gold-light",
              someoneSpeaking && "ring-2 ring-pitch-bright/60"
            )}
          >
            <Radio size={16} aria-hidden />
            {someoneSpeaking && (
              <span
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-pitch-bright"
                aria-hidden
              />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-off-white">Voice chat</p>
            <p className="truncate text-xs text-on-pitch-subtle">
              {shortStatusLabel(status, isMicrophoneEnabled)}
            </p>
          </div>

          {isBusy ? (
            <Loader2 size={16} className="shrink-0 animate-spin text-gold-light" />
          ) : (
            <>
              <Button
                type="button"
                variant={isMicrophoneEnabled ? "secondary" : "gold"}
                size="sm"
                className="shrink-0 px-2.5"
                onClick={() => void toggleMicrophone()}
                aria-label={isMicrophoneEnabled ? "Mutar microfone" : "Ativar microfone"}
              >
                {isMicrophoneEnabled ? (
                  <Mic size={14} aria-hidden />
                ) : (
                  <MicOff size={14} aria-hidden />
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 px-2.5"
                onClick={() => void leaveVoice()}
                aria-label="Sair do áudio"
              >
                <PhoneOff size={14} aria-hidden />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 px-2.5"
                onClick={expandDock}
                aria-label="Expandir painel de voice chat"
                aria-expanded={false}
              >
                <ChevronUp size={14} aria-hidden />
              </Button>
            </>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "pointer-events-auto rounded-2xl border border-off-white/10 bg-pitch/90 p-3 shadow-2xl backdrop-blur-md",
            isConnected &&
              "max-h-[min(45vh,16rem)] overflow-y-auto md:max-h-none md:overflow-visible"
          )}
          role="region"
          aria-label="Voice chat"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 rounded-full bg-gold/15 p-2 text-gold-light">
                {isConnected ? (
                  <Radio size={16} aria-hidden />
                ) : (
                  <Headphones size={16} aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-off-white">Voice chat</p>
                <p
                  className={cn(
                    "text-xs",
                    status === "error" ? "text-red-300" : "text-on-pitch-subtle"
                  )}
                >
                  {statusLabel(status, isMicrophoneEnabled)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {isBusy && <Loader2 size={16} className="animate-spin text-gold-light" />}
              {isConnected && !forceExpanded && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="px-2.5"
                  onClick={collapseDock}
                  aria-label="Minimizar painel de voice chat"
                  aria-expanded
                >
                  <ChevronDown size={14} aria-hidden />
                </Button>
              )}
            </div>
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
            <div className="space-y-2">
              {isTouchPrimaryDevice() && canJoin && !error && (
                <p className="text-xs text-on-pitch-subtle">
                  Toque no botão abaixo — o Safari pedirá permissão do microfone.
                </p>
              )}
              {joinDisabledReason && !canJoin && (
                <p className="text-xs text-on-pitch-subtle">{joinDisabledReason}</p>
              )}
              <Button
                type="button"
                variant="gold"
                size="sm"
                className="w-full"
                disabled={!canJoin || isBusy}
                onClick={() => void joinVoice()}
              >
                <Mic size={14} className="mr-2" aria-hidden />
                Entrar no áudio
              </Button>
            </div>
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
                  aria-label="Sair do áudio"
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
      )}
    </div>
  );
}
