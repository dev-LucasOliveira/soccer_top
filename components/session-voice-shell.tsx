"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { VoiceChatControls } from "@/components/voice-chat/voice-chat-controls";
import { VoiceChatProvider } from "@/components/voice-chat/voice-chat-provider";
import {
  handleRemovedFromSession,
  isRemovedFromSessionResponse,
  participantStorageKey,
} from "@/lib/session-membership";

const MEMBERSHIP_POLL_MS = 10_000;

function readStoredParticipantId(code: string): string | null {
  if (typeof window === "undefined" || !code) return null;
  return localStorage.getItem(participantStorageKey(code));
}

function useSessionParticipant(code: string) {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(() =>
    readStoredParticipantId(code)
  );

  useEffect(() => {
    function syncParticipantId() {
      setParticipantId(readStoredParticipantId(code));
    }

    window.addEventListener("storage", syncParticipantId);
    window.addEventListener("focus", syncParticipantId);
    const interval = setInterval(syncParticipantId, 1000);
    const stopPolling = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      window.removeEventListener("storage", syncParticipantId);
      window.removeEventListener("focus", syncParticipantId);
      clearInterval(interval);
      clearTimeout(stopPolling);
    };
  }, [code]);

  useEffect(() => {
    if (!code || !participantId) return;

    let cancelled = false;

    async function pollMembership() {
      try {
        const res = await fetch(
          `/api/sessions/${code}?participantId=${participantId}`
        );
        const data = await res.json();
        if (!cancelled && isRemovedFromSessionResponse(res, data)) {
          handleRemovedFromSession(code, router);
        }
      } catch {
        // Membership polling is best-effort.
      }
    }

    pollMembership();
    const interval = setInterval(pollMembership, MEMBERSHIP_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [code, participantId, router]);

  return participantId;
}

export function SessionVoiceShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const participantId = useSessionParticipant(code);

  return (
    <VoiceChatProvider sessionCode={code} participantId={participantId}>
      <div className="pb-[var(--voice-chat-inset,0px)]">{children}</div>
      <VoiceChatControls />
    </VoiceChatProvider>
  );
}
