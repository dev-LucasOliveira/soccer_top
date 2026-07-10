"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResultsView } from "@/components/results-view";
import { SessionHeader } from "@/components/session-header";
import type { SessionFinalResult } from "@/lib/types";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [result, setResult] = useState<SessionFinalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResults() {
      const p = await params;
      setCode(p.code);

      const res = await fetch(`/api/sessions/${p.code}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao carregar resultados");
        setLoading(false);
        return;
      }

      setTitle(data.title);

      if (data.status !== "completed" || !data.result) {
        setError("A sala ainda não foi finalizada");
      } else {
        setResult(data.result);
      }

      setLoading(false);
    }

    fetchResults();
  }, [params]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-center text-off-white/70">Carregando resultados...</p>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href={`/s/${code}`}
          className="mb-6 inline-block text-sm text-off-white/70 hover:text-off-white"
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
        title={title}
        code={code}
        stepLabel="Resultado final"
        backHref={`/s/${code}`}
      />

      <ResultsView title={title} sessionCode={code} result={result} />
    </main>
  );
}
