"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GuessTopRound } from "@/components/guess-top-round";
import {
  isGuessTopRoundStale,
  type GuessTopPublicRound,
  type RevealedSlot,
} from "@/lib/guess-top-types";
import { clearGuessTopClientSession } from "@/lib/guess-top-session";

type BootstrapSession = {
  sessionToken: string;
  roundIndex: number;
  errorsUsed: number;
  topsCompleted: number;
  revealedSlots: RevealedSlot[];
  attemptedPlayerIds: string[];
  bootstrap: {
    maxErrors: number;
    totalRounds: number;
    currentRound: GuessTopPublicRound;
  };
};

export default function SoloGuessPlayPage() {
  const [session, setSession] = useState<BootstrapSession | null>(null);
  const [missing, setMissing] = useState(false);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("guess-top-session");
      if (!raw) {
        setMissing(true);
        return;
      }
      const parsed = JSON.parse(raw) as BootstrapSession & { bootstrap?: BootstrapSession["bootstrap"] };
      if (!parsed.sessionToken || !parsed.bootstrap?.currentRound) {
        setMissing(true);
        return;
      }
      if (isGuessTopRoundStale(parsed.bootstrap.currentRound)) {
        clearGuessTopClientSession();
        setStale(true);
        return;
      }
      setSession(parsed);
    } catch {
      setMissing(true);
    }
  }, []);

  if (missing || stale) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center">
        <p className="text-on-pitch-muted">
          {stale
            ? "Sessão antiga detectada — inicie um novo jogo para ver as dicas de clube."
            : "Nenhuma sessão ativa."}
        </p>
        <Link
          href="/solo/guess"
          className="mt-4 inline-block text-sm text-gold-light hover:text-off-white"
        >
          Iniciar novo jogo →
        </Link>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-center text-on-pitch-muted">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/solo/guess"
        className="mb-6 inline-block text-sm text-on-pitch-muted transition-colors hover:text-off-white"
      >
        ← Sair do jogo
      </Link>

      <GuessTopRound
        initialSession={{
          sessionToken: session.sessionToken,
          maxErrors: session.bootstrap.maxErrors,
          errorsUsed: session.errorsUsed,
          topsCompleted: session.topsCompleted,
          roundIndex: session.roundIndex,
          totalRounds: session.bootstrap.totalRounds,
          currentRound: session.bootstrap.currentRound,
          revealedSlots: session.revealedSlots ?? [],
          attemptedPlayerIds: session.attemptedPlayerIds ?? [],
          gameOver: false,
        }}
      />
    </main>
  );
}
