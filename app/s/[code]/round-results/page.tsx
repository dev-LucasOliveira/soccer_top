"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionHeader } from "@/components/session-header";
import { RoundResultsView } from "@/components/round-results-view";
import type { RoundResultData, StandingEntry } from "@/lib/types";

export default function RoundResultsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [roundResult, setRoundResult] = useState<RoundResultData | null>(null);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [roundNumber, setRoundNumber] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      const p = await params;
      setCode(p.code);

      const res = await fetch(`/api/sessions/${p.code}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao carregar");
        setLoading(false);
        return;
      }

      setTitle(data.title);
      setTotalRounds(data.totalRounds);
      setStandings(data.standings ?? []);

      const lastCompleted = [...(data.rounds ?? [])]
        .reverse()
        .find((r: { status: string }) => r.status === "completed");

      if (!lastCompleted) {
        setError("Nenhum round encerrado ainda");
        setLoading(false);
        return;
      }

      const roundRes = await fetch(
        `/api/sessions/${p.code}/round-results?round=${lastCompleted.number}`
      );
      const roundData = await roundRes.json();
      if (roundRes.ok) {
        setRoundResult(roundData.result);
        setRoundNumber(roundData.roundNumber);
      } else {
        setError(roundData.error ?? "Resultado do round indisponível");
      }

      if (data.status === "completed") {
        router.prefetch(`/s/${p.code}/results`);
      }

      setLoading(false);
    }

    fetchData();
  }, [params, router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-center text-off-white/70">Carregando...</p>
      </main>
    );
  }

  if (error || !roundResult) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href={`/s/${code}`}
          className="mb-6 inline-block text-sm text-off-white/70 hover:text-off-white"
        >
          ← Voltar ao lobby
        </Link>
        <p className="text-center text-red-300">{error || "Resultado indisponível"}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <SessionHeader
        title={title}
        code={code}
        stepLabel={`Round ${roundNumber}/${totalRounds} encerrado`}
        backHref={`/s/${code}`}
      />

      <RoundResultsView
        roundResult={roundResult}
        standings={standings}
        roundNumber={roundNumber}
        totalRounds={totalRounds}
        isLastRound={roundNumber >= totalRounds}
      />
    </main>
  );
}
