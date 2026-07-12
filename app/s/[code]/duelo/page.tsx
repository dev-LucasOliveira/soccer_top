"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DueloPlayView } from "@/components/duelo-play-view";
import { SessionHeader } from "@/components/session-header";
import { buildParticipantPath } from "@/lib/session-info";
import type { DueloViewState } from "@/lib/types";

export default function DueloPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [stepLabel, setStepLabel] = useState("");
  const [dueloView, setDueloView] = useState<DueloViewState | null>(null);
  const [participants, setParticipants] = useState<
    { id: string; displayName: string }[]
  >([]);
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

      const res = await fetch(`/api/sessions/${p.code}?participantId=${stored}`);
      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        return;
      }

      if (data.gameMode !== "duelo") {
        router.replace(buildParticipantPath(p.code, data, stored));
        return;
      }

      if (data.status === "completed") {
        router.replace(`/s/${p.code}/results`);
        return;
      }

      if (data.status !== "active") {
        router.replace(`/s/${p.code}`);
        return;
      }

      setTitle(data.title);
      setStepLabel(
        data.dueloView
          ? `Rodada ${data.dueloView.roundNumber}/${data.dueloView.totalRounds}`
          : "Duelo"
      );
      setDueloView(data.dueloView ?? null);
      setParticipants(
        data.participants.map((p: { id: string; displayName: string }) => ({
          id: p.id,
          displayName: p.displayName,
        }))
      );
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <SessionHeader
        title={title}
        code={code}
        stepLabel={stepLabel}
        backHref={`/s/${code}`}
        showCode={false}
      />

      <DueloPlayView
        sessionCode={code}
        participantId={participantId}
        participants={participants}
        initialView={dueloView}
      />

      <div className="mt-6 text-center">
        <Link
          href={`/s/${code}`}
          className="text-sm text-on-pitch-muted transition-colors hover:text-off-white"
        >
          ← Voltar ao lobby
        </Link>
      </div>
    </main>
  );
}
