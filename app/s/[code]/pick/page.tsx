"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlayerPicker } from "@/components/player-picker";
import { ImpostorPickView } from "@/components/impostor-pick-view";
import { SessionHeader } from "@/components/session-header";
import { AbortSessionButton } from "@/components/abort-session-button";
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
  const [initialMessage, setInitialMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gameMode, setGameMode] = useState<"ranking" | "impostor">("ranking");
  const [isCreator, setIsCreator] = useState(false);
  const [pickTimeLimitSeconds, setPickTimeLimitSeconds] = useState<number | null>(
    null
  );
  const [roundOpenedAt, setRoundOpenedAt] = useState<string | null>(null);

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
        setIsCreator(sessionData.isCreator === true);
        setGameMode(sessionData.gameMode === "impostor" ? "impostor" : "ranking");

        if (sessionData.gameMode === "impostor") {
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
          setLoading(false);
          return;
        }

        setTopN(sessionData.topN);
        if (sessionData.currentRound) {
          setRoundTitle(sessionData.currentRound.title);
          setStepLabel(
            `Rodada ${sessionData.currentRoundNumber}/${sessionData.totalRounds}`
          );
          setPickTimeLimitSeconds(
            sessionData.currentRound.pickTimeLimitSeconds ?? null
          );
          setRoundOpenedAt(sessionData.currentRound.openedAt ?? null);
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
        if (picksData.status === "spectator") {
          router.push(buildParticipantPath(p.code, sessionData, stored));
          return;
        }
        setPicks(picksData.picks);
        setInitialMessage(picksData.message ?? "");
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
        <p className="loading-pulse text-center text-on-pitch-muted">Carregando...</p>
      </main>
    );
  }

  if (gameMode === "impostor") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <SessionHeader
          title="Escolha sua carta"
          code={code}
          stepLabel="Modo impostor"
          backHref={isCreator ? `/s/${code}` : `/s/${code}/status`}
          showCode={false}
        />
        <ImpostorPickView sessionCode={code} participantId={participantId} />
        {isCreator && (
          <div className="mt-8 flex justify-center">
            <AbortSessionButton sessionCode={code} participantId={participantId} />
          </div>
        )}
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
        backHref={isCreator ? `/s/${code}` : `/s/${code}/status`}
        showCode={false}
      />

      <PlayerPicker
        sessionCode={code}
        participantId={participantId}
        topN={topN}
        initialPicks={topItems}
        initialMessage={initialMessage}
        confirmed={confirmed}
        pickTimeLimitSeconds={pickTimeLimitSeconds}
        roundOpenedAt={roundOpenedAt}
      />

      {isCreator && (
        <div className="mt-8 flex justify-center">
          <AbortSessionButton sessionCode={code} participantId={participantId} />
        </div>
      )}
    </main>
  );
}
