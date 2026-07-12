"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GuessTopResultView } from "@/components/guess-top-result-view";
import { GUESS_TOP_MAX_ERRORS } from "@/lib/guess-top-challenges";

function GuessResultContent() {
  const searchParams = useSearchParams();
  const tops = Number(searchParams.get("tops") ?? "0");
  const errors = Number(
    searchParams.get("errors") ?? String(GUESS_TOP_MAX_ERRORS)
  );
  const reasonParam = searchParams.get("reason") ?? "errors";
  const reason = reasonParam === "completed" ? "completed" : "errors";

  return (
    <GuessTopResultView
      fallbackTops={tops}
      fallbackErrors={errors}
      fallbackReason={reason}
    />
  );
}

export default function SoloGuessResultPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-8">
          <p className="text-center text-on-pitch-muted">Carregando...</p>
        </main>
      }
    >
      <GuessResultContent />
    </Suspense>
  );
}
