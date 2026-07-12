"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UmSoRound } from "@/components/um-so-round";
import { clearUmSoClientSession } from "@/lib/um-so-session";
import type { UmSoPublicRound } from "@/lib/um-so-types";

type BootstrapSession = {
  sessionToken: string;
  score: number;
  streak: number;
  roundsCompleted: number;
  attemptedPlayerIds: string[];
  bootstrap: {
    currentRound: UmSoPublicRound;
  };
};

export default function UmSoPlayPage() {
  const [session, setSession] = useState<BootstrapSession | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("um-so-session");
      if (!raw) {
        setMissing(true);
        return;
      }
      const parsed = JSON.parse(raw) as BootstrapSession;
      if (!parsed.sessionToken || !parsed.bootstrap?.currentRound) {
        setMissing(true);
        return;
      }
      setSession(parsed);
    } catch {
      setMissing(true);
    }
  }, []);

  if (missing) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 text-center">
        <p className="text-on-pitch-muted">Nenhuma sessão ativa.</p>
        <Link
          href="/solo/um-so"
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
        href="/solo/um-so"
        className="mb-6 inline-block text-sm text-on-pitch-muted transition-colors hover:text-off-white"
        onClick={() => clearUmSoClientSession()}
      >
        ← Sair do jogo
      </Link>

      <UmSoRound
        initialSession={{
          sessionToken: session.sessionToken,
          score: session.score,
          streak: session.streak,
          roundsCompleted: session.roundsCompleted,
          currentRound: session.bootstrap.currentRound,
          attemptedPlayerIds: session.attemptedPlayerIds ?? [],
          gameOver: false,
        }}
      />
    </main>
  );
}
