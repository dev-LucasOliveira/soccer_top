"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGuestToken } from "@/lib/guest";
import {
  DEFAULT_DUELO_ROUNDS,
  MAX_DUELO_ROUNDS,
  MIN_DUELO_ROUNDS,
} from "@/lib/duelo-constants";

export function DueloLobbyConfig({
  code,
  participantId,
  initialRounds,
  onSaved,
}: {
  code: string;
  participantId: string;
  initialRounds: number | null;
  onSaved: () => void;
}) {
  const [rounds, setRounds] = useState(initialRounds ?? DEFAULT_DUELO_ROUNDS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/sessions/${code}/duelo/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
          totalRounds: rounds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Número de rodadas
        </label>
        <p className="mb-2 text-xs text-text-muted">
          Cada rodada sorteia um tema e um jogador secreto. Turnos alternados com
          dicas compartilhadas.
        </p>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={MIN_DUELO_ROUNDS}
            max={MAX_DUELO_ROUNDS}
            value={rounds}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (!Number.isNaN(value)) setRounds(value);
            }}
            className="w-24"
          />
          <input
            type="range"
            min={MIN_DUELO_ROUNDS}
            max={MAX_DUELO_ROUNDS}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="flex-1 accent-gold"
          />
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {MIN_DUELO_ROUNDS}–{MAX_DUELO_ROUNDS} rodadas (padrão {DEFAULT_DUELO_ROUNDS})
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        type="button"
        variant="secondary"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar configuração"}
      </Button>
    </div>
  );
}
