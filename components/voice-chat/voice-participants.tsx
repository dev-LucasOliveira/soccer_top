"use client";

import { useVoiceChat } from "./voice-chat-provider";
import { VoiceParticipantRow } from "./participant-volume";

export function VoiceParticipants() {
  const { participants, status } = useVoiceChat();

  if (participants.length === 0) {
    return (
      <p className="text-xs text-on-pitch-subtle">
        {status === "connected" || status === "reconnecting"
          ? "Aguardando outros participantes no áudio..."
          : "Ninguém no áudio ainda."}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {participants.map((participant) => (
        <VoiceParticipantRow key={participant.id} participant={participant} />
      ))}
    </div>
  );
}
