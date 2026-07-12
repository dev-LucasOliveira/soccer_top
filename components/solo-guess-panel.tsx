"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  GUESS_TOP_CHALLENGES,
  GUESS_TOP_MAX_ERRORS,
} from "@/lib/guess-top-challenges";
import { loadGuessTopBest } from "@/lib/guess-top-session";

export function SoloGuessPanel() {
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    const record = loadGuessTopBest();
    setBest(record?.topsCompleted ?? null);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-on-pitch-muted">
        Descubra quem está na lista secreta — não é montar um ranking.
      </p>
      <ul className="space-y-1 text-sm text-on-pitch-subtle">
        <li>· Cada tema sorteia 5 jogadores secretos de um pool curado</li>
        <li>· Dica em cada carta: clube e período (ex. AC Milan 2003–2008)</li>
        <li>· Acertou → revela o jogador; errou → +1 erro</li>
        <li>
          · Complete os 5 de um tema para somar +1 — até{" "}
          {GUESS_TOP_CHALLENGES.length} rodadas
        </li>
      </ul>

      {best !== null && best > 0 && (
        <p className="text-sm text-gold-light/90">
          Seu recorde: <strong>{best}</strong> rodada{best === 1 ? "" : "s"}{" "}
          completas (máx. {GUESS_TOP_MAX_ERRORS} erros por sessão)
        </p>
      )}

      <Link href="/solo/guess" className="block">
        <Button type="button" className="w-full">
          Jogar agora
        </Button>
      </Link>
    </div>
  );
}
