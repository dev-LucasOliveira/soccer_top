"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GUESS_TOP_CHALLENGES } from "@/lib/guess-top-challenges";
import { clearUmSoRecap, loadUmSoBest } from "@/lib/um-so-session";
import type { UmSoBestScore } from "@/lib/um-so-types";

export function SoloUmSoHub() {
  const [best, setBest] = useState<UmSoBestScore | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBest(loadUmSoBest());
  }, []);

  async function handleStart() {
    setStarting(true);
    setError("");

    try {
      clearUmSoRecap();
      const res = await fetch("/api/solo/um-so/session", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      sessionStorage.setItem(
        "um-so-session",
        JSON.stringify({
          sessionToken: data.sessionToken,
          score: data.score,
          streak: data.streak,
          roundsCompleted: data.roundsCompleted,
          attemptedPlayerIds: data.attemptedPlayerIds,
          gameOver: false,
          bootstrap: {
            currentRound: data.currentRound,
          },
        })
      );

      window.location.href = "/solo/um-so/play";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar");
      setStarting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-on-pitch-muted">
        Um <strong className="text-off-white">jogador misterioso</strong> por
        rodada. Chute à vontade sem dicas — cada erro revela a próxima pista até
        a última. Errou com todas as dicas visíveis → fim de jogo.
      </p>

      <ul className="space-y-1 text-sm text-on-pitch-subtle">
        <li>· Acertou às cegas → 1000 pts (Genial)</li>
        <li>· Quanto mais dicas usadas, menor a pontuação</li>
        <li>· Streak de acertos aumenta o multiplicador</li>
        <li>· {GUESS_TOP_CHALLENGES.length} temas possíveis por rodada</li>
      </ul>

      {best && (
        <p className="text-sm text-gold-light/90">
          Seu recorde: <strong>{best.score}</strong> pts (streak{" "}
          {best.bestStreak})
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
    </div>
  );
}
