"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VoteView } from "@/components/vote-view";
import { SessionHeader } from "@/components/session-header";

export default function VotePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [topN, setTopN] = useState(10);
  const [roundLabel, setRoundLabel] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);

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
        setTitle(sessionData.title);
        setTopN(sessionData.topN);
        if (sessionData.currentRound) {
          setRoundLabel(
            `Round ${sessionData.currentRoundNumber}/${sessionData.totalRounds} · ${sessionData.currentRound.title}`
          );
        }
        if (sessionData.status === "completed") {
          router.push(`/s/${p.code}/results`);
        } else if (
          sessionData.status !== "active" ||
          sessionData.currentRound?.status !== "voting"
        ) {
          router.push(`/s/${p.code}`);
        }
      }
    }
    init();
  }, [params, router]);

  if (!participantId) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-center text-off-white/70">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <SessionHeader
        title={title}
        code={code}
        stepLabel={roundLabel || "Votação"}
        topN={topN}
        backHref={`/s/${code}`}
      />
      <VoteView sessionCode={code} participantId={participantId} />
    </main>
  );
}
