"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { UmSoResultView } from "@/components/um-so-result-view";

function UmSoResultContent() {
  const searchParams = useSearchParams();
  const score = Number(searchParams.get("score") ?? "0");
  const streak = Number(searchParams.get("streak") ?? "0");
  const rounds = Number(searchParams.get("rounds") ?? "0");

  return (
    <UmSoResultView
      fallbackScore={score}
      fallbackStreak={streak}
      fallbackRounds={rounds}
    />
  );
}

export default function UmSoResultPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-8">
          <p className="text-center text-on-pitch-muted">Carregando...</p>
        </main>
      }
    >
      <UmSoResultContent />
    </Suspense>
  );
}
