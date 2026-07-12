"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  GUESS_TOP_CHALLENGES,
  GUESS_TOP_MAX_ERRORS,
} from "@/lib/guess-top-challenges";
import { clearGuessTopRecap, loadGuessTopBest, type GuessTopBestScore } from "@/lib/guess-top-session";

export function SoloGuessHub() {
  const [best, setBest] = useState<GuessTopBestScore | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBest(loadGuessTopBest());
  }, []);

  async function handleStart() {
    setStarting(true);
    setError("");

    try {
      clearGuessTopRecap();
      const res = await fetch("/api/solo/guess/session", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      sessionStorage.setItem(
        "guess-top-session",
        JSON.stringify({
          sessionToken: data.sessionToken,
          challengeOrder: [],
          roundIndex: data.roundIndex,
          errorsUsed: data.errorsUsed,
          topsCompleted: data.topsCompleted,
          revealedSlots: data.revealedSlots,
          attemptedPlayerIds: data.attemptedPlayerIds,
          gameOver: false,
          bootstrap: {
            maxErrors: data.maxErrors,
            totalRounds: data.totalRounds,
            currentRound: data.currentRound,
          },
        })
      );

      window.location.href = "/solo/guess/play";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar");
      setStarting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-on-pitch-muted">
        Cada tema sorteia{" "}
        <strong className="text-off-white">5 jogadores secretos</strong> de um
        pool curado. Cada carta mostra uma dica de clube e período — pesquise e
        descubra quem está na rodada. Você tem{" "}
        <strong className="text-off-white">{GUESS_TOP_MAX_ERRORS} erros</strong>{" "}
        para completar o máximo de rodadas em{" "}
        <strong className="text-off-white">{GUESS_TOP_CHALLENGES.length} temas</strong>.
      </p>

      <ul className="space-y-1 text-sm text-on-pitch-subtle">
        <li>· Acertou → revela o jogador da carta</li>
        <li>· Errou → +1 erro; a sessão continua até esgotar as vidas</li>
        <li>· Descubra os 5 de um tema para somar +1 no placar</li>
        <li>· Cada partida sorteia uma combinação diferente do pool</li>
      </ul>

      {best && (
        <p className="text-sm text-gold-light/90">
          Seu recorde: <strong>{best.topsCompleted}</strong> rodada
          {best.topsCompleted === 1 ? "" : "s"} completas
        </p>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}

      <Button
        type="button"
        className="w-full"
        disabled={starting}
        onClick={handleStart}
      >
        {starting ? "Iniciando..." : "Jogar agora"}
      </Button>

      <Link
        href="/"
        className="block text-center text-sm text-on-pitch-muted transition-colors hover:text-off-white"
      >
        ← Voltar ao início
      </Link>
    </div>
  );
}
