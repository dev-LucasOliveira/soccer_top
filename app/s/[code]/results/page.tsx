"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResultsView } from "@/components/results-view";
import { SessionHeader } from "@/components/session-header";
import { getGuestToken } from "@/lib/guest";
import type { SessionFinalResult } from "@/lib/types";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [result, setResult] = useState<SessionFinalResult | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState("");

  useEffect(() => {
    params.then((p) => {
      setCode(p.code);
      const stored = localStorage.getItem(`participant_${p.code}`);
      if (stored) setParticipantId(stored);
    });
  }, [params]);

  const fetchSession = useCallback(async () => {
    if (!code) return;

    const query = participantId ? `?participantId=${participantId}` : "";
    const res = await fetch(`/api/sessions/${code}${query}`);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao carregar resultados");
      setLoading(false);
      return;
    }

    if (data.status !== "completed") {
      router.replace(`/s/${code}`);
      return;
    }

    setTitle(data.title);
    setIsCreator(data.isCreator ?? false);

    if (!data.result) {
      setError("Resultados indisponíveis");
    } else {
      setResult(data.result);
      setError("");
    }

    setLoading(false);
  }, [code, participantId, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!code) return;
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, [code, fetchSession]);

  async function handleRestart() {
    if (!participantId) return;

    setRestarting(true);
    setRestartError("");

    try {
      const res = await fetch(`/api/sessions/${code}/restart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.replace(`/s/${code}`);
      router.refresh();
    } catch (err) {
      setRestartError(
        err instanceof Error ? err.message : "Erro ao reiniciar sessão"
      );
    } finally {
      setRestarting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="loading-pulse text-center text-on-pitch-muted">Carregando resultados...</p>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href={`/s/${code}`}
          className="mb-6 inline-block text-sm text-on-pitch-muted transition-colors duration-200 hover:text-off-white"
        >
          ← Voltar à sala
        </Link>
        <p className="text-center text-red-300">{error || "Resultados indisponíveis"}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <SessionHeader
        code={code}
        stepLabel="Resultado final"
        backHref={`/s/${code}`}
        showCode={false}
      />

      <ResultsView
        title={title}
        sessionCode={code}
        result={result}
        isCreator={isCreator}
        onRestart={handleRestart}
        restarting={restarting}
        restartError={restartError}
      />
    </main>
  );
}
