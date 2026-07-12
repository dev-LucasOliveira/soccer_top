"use client";

import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceChat } from "./voice-chat-provider";
import type { VoiceParticipant } from "./voice-chat.types";

function ParticipantVolumeRow({ participant }: { participant: VoiceParticipant }) {
  const { setParticipantVolume, toggleParticipantLocalMute } = useVoiceChat();

  if (participant.isLocal) {
    return null;
  }

  return (
    <div className="space-y-1 rounded-lg bg-off-white/[0.04] px-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-off-white">{participant.name}</span>
        <button
          type="button"
          onClick={() => toggleParticipantLocalMute(participant.id)}
          className="rounded-md p-1 text-on-pitch-subtle transition-colors hover:bg-off-white/10 hover:text-off-white"
          aria-label={
            participant.isLocallyMuted
              ? `Ativar áudio de ${participant.name}`
              : `Silenciar ${participant.name} localmente`
          }
        >
          {participant.isLocallyMuted ? (
            <VolumeX size={14} aria-hidden />
          ) : (
            <Volume2 size={14} aria-hidden />
          )}
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={participant.isLocallyMuted ? 0 : participant.volume}
        onChange={(event) =>
          setParticipantVolume(participant.id, Number(event.target.value))
        }
        className="w-full accent-gold"
        aria-label={`Volume de ${participant.name}`}
      />
    </div>
  );
}

export function ParticipantVolumeControls() {
  const { participants, status } = useVoiceChat();
  const remoteParticipants = participants.filter((participant) => !participant.isLocal);

  if (
    remoteParticipants.length === 0 ||
    (status !== "connected" && status !== "reconnecting")
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-on-pitch-subtle">
        Volume individual
      </p>
      {remoteParticipants.map((participant) => (
        <ParticipantVolumeRow key={participant.id} participant={participant} />
      ))}
    </div>
  );
}

export function VoiceParticipantRow({
  participant,
}: {
  participant: VoiceParticipant;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            participant.isSpeaking ? "bg-pitch-bright" : "bg-off-white/20"
          )}
          aria-hidden
        />
        <span className="truncate text-sm text-off-white">
          {participant.name}
          {participant.isLocal ? " (você)" : ""}
        </span>
      </div>
      <span className="text-xs text-on-pitch-subtle">
        {participant.isLocal
          ? participant.isMicrophoneEnabled
            ? "mic on"
            : "mutado"
          : participant.isLocallyMuted
            ? "silenciado"
            : "ouvindo"}
      </span>
    </div>
  );
}
