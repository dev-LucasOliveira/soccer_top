"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { VoiceChatControls } from "@/components/voice-chat/voice-chat-controls";
import { VoiceChatProvider } from "@/components/voice-chat/voice-chat-provider";

function useSessionParticipant(code: string) {
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`participant_${code}`);
    setParticipantId(stored);
  }, [code]);

  useEffect(() => {
    if (!code || !participantId) return;

    let cancelled = false;

    async function pollSessionStatus() {
      try {
        const res = await fetch(
          `/api/sessions/${code}?participantId=${participantId}`
        );
        const data = await res.json();
        if (!cancelled && res.ok) {
          setSessionCompleted(data.status === "completed");
        }
      } catch {
        // Voice is optional; ignore polling failures.
      }
    }

    pollSessionStatus();
    const interval = setInterval(pollSessionStatus, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [code, participantId]);

  return { participantId, sessionCompleted };
}

export default function SessionVoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const { participantId, sessionCompleted } = useSessionParticipant(code);

  return (
    <VoiceChatProvider
      sessionCode={code}
      participantId={participantId}
      sessionCompleted={sessionCompleted}
    >
      {children}
      <VoiceChatControls />
    </VoiceChatProvider>
  );
}
