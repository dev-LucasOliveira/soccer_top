"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getGuestToken } from "@/lib/guest";
import { buildParticipantPath } from "@/lib/session-info";

type SessionPhaseData = {
  isCreator: boolean;
  status: string;
  currentRound: { status: string } | null;
  advanceAction: {
    canAdvance: boolean;
    label: string;
    redirect?: string;
  } | null;
};

export function ImpostorPhaseControls({
  sessionCode,
  participantId,
  expectedRoundStatus,
  creatorHint,
  waitingHint,
}: {
  sessionCode: string;
  participantId: string;
  expectedRoundStatus: "reveal" | "voting";
  creatorHint?: string;
  waitingHint?: string;
}) {
  const router = useRouter();
  const [session, setSession] = useState<SessionPhaseData | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState("");

  const fetchSession = useCallback(async () => {
    const res = await fetch(
      `/api/sessions/${sessionCode}?participantId=${participantId}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setSession(data);

    const targetPath = buildParticipantPath(sessionCode, data, participantId);
    const currentPath =
      expectedRoundStatus === "reveal"
        ? `/s/${sessionCode}/reveal`
        : `/s/${sessionCode}/vote`;

    if (targetPath !== currentPath) {
      router.push(targetPath);
    }
  }, [sessionCode, participantId, expectedRoundStatus, router]);

  useEffect(() => {
    fetchSession().catch((err) =>
      setError(err instanceof Error ? err.message : "Erro ao carregar fase")
    );
    const interval = setInterval(() => {
      fetchSession().catch(() => undefined);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  async function handleAdvance() {
    if (!session?.advanceAction) return;
    setAdvancing(true);
    setError("");

    try {
      const res = await fetch(`/api/sessions/${sessionCode}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const sessionRes = await fetch(
        `/api/sessions/${sessionCode}?participantId=${participantId}`
      );
      const sessionData = await sessionRes.json();
      if (sessionRes.ok) {
        router.push(buildParticipantPath(sessionCode, sessionData, participantId));
        return;
      }

      await fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao avançar fase");
    } finally {
      setAdvancing(false);
    }
  }

  if (!session) return null;

  const onExpectedPhase =
    session.status === "active" &&
    session.currentRound?.status === expectedRoundStatus;

  if (!onExpectedPhase) {
    return null;
  }

  return (
    <div className="space-y-3">
      {session.isCreator && session.advanceAction ? (
        <>
          {creatorHint && (
            <p className="text-center text-sm text-text-muted">{creatorHint}</p>
          )}
          <div className="flex justify-center">
            <Button
              variant="gold"
              size="lg"
              disabled={!session.advanceAction.canAdvance || advancing}
              onClick={handleAdvance}
              className="w-full sm:w-auto"
            >
              {advancing ? "Processando..." : session.advanceAction.label}
            </Button>
          </div>
        </>
      ) : (
        waitingHint && (
          <p className="waiting-pill px-5 py-3 text-center text-sm text-off-white/85">
            {waitingHint}
          </p>
        )
      )}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
