"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImpostorRevealView } from "@/components/impostor-reveal-view";
import { SessionHeader } from "@/components/session-header";
import { buildParticipantPath } from "@/lib/session-info";

export default function RevealPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [roundTitle, setRoundTitle] = useState("");
  const [stepLabel, setStepLabel] = useState("");

  useEffect(() => {
    async function init() {
      const p = await params;
      setCode(p.code);

      const stored = localStorage.getItem(`participant_${p.code}`);
      if (!stored) {
        router.push(`/s/${p.code}`);
        return;
      }
      setParticipantId(stored);

      const sessionRes = await fetch(
        `/api/sessions/${p.code}?participantId=${stored}`
      );
      const sessionData = await sessionRes.json();
      if (sessionRes.ok) {
        if (sessionData.gameMode !== "impostor") {
          router.push(buildParticipantPath(p.code, sessionData, stored));
          return;
        }

        if (sessionData.currentRound) {
          setRoundTitle(sessionData.currentRound.title);
          setStepLabel(
            `Rodada ${sessionData.currentRoundNumber}/${sessionData.totalRounds}`
          );
        }

        if (sessionData.status === "completed") {
          router.push(`/s/${p.code}/results`);
          return;
        }

        if (
          sessionData.status !== "active" ||
          sessionData.currentRound?.status !== "reveal"
        ) {
          router.push(buildParticipantPath(p.code, sessionData, stored));
        }
      }
    }
    init();
  }, [params, router]);

  if (!participantId) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="loading-pulse text-center text-on-pitch-muted">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <SessionHeader
        title={roundTitle || "Debate"}
        code={code}
        stepLabel={stepLabel || "Debate"}
        backHref={`/s/${code}/status`}
        showCode={false}
      />
      <ImpostorRevealView sessionCode={code} participantId={participantId} />
    </main>
  );
}
