"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlayerPicker } from "@/components/player-picker";
import { SessionHeader } from "@/components/session-header";
import { buildParticipantPath } from "@/lib/session-info";

type Pick = {
  rank: number;
  playerId: string;
  playerName: string;
  position: string;
  nationality: string;
};

export default function PickPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [topN, setTopN] = useState(10);
  const [roundTitle, setRoundTitle] = useState("");
  const [stepLabel, setStepLabel] = useState("");
  const [picks, setPicks] = useState<Pick[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

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

      const sessionRes = await fetch(`/api/sessions/${p.code}`);
      const sessionData = await sessionRes.json();
      if (sessionRes.ok) {
        setTopN(sessionData.topN);
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
          sessionData.currentRound?.status !== "open"
        ) {
          router.push(buildParticipantPath(p.code, sessionData, stored));
          return;
        }
      }

      const picksRes = await fetch(
        `/api/sessions/${p.code}/picks?participantId=${stored}`
      );
      const picksData = await picksRes.json();
      if (picksRes.ok) {
        setPicks(picksData.picks);
        setConfirmed(picksData.status === "confirmed");
        if (picksData.status === "confirmed") {
          router.push(`/s/${p.code}/status`);
          return;
        }
      }

      setLoading(false);
    }
    init();
  }, [params, router]);

  if (loading || !participantId) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-center text-off-white/70">Carregando...</p>
      </main>
    );
  }

  const topItems = picks.map((p) => ({
    playerId: p.playerId,
    playerName: p.playerName,
    position: p.position,
    nationality: p.nationality,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <SessionHeader
        title={roundTitle}
        code={code}
        stepLabel={stepLabel || "Montando ranking"}
        topN={topN}
        backHref={`/s/${code}/status`}
        showCode={false}
      />

      <PlayerPicker
        sessionCode={code}
        participantId={participantId}
        topN={topN}
        initialPicks={topItems}
        confirmed={confirmed}
      />
    </main>
  );
}
