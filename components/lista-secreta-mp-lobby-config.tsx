"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGuestToken } from "@/lib/guest";
import {
  DEFAULT_LSMP_ROUNDS,
  DEFAULT_LSMP_SLOT_COUNT,
  MAX_LSMP_ROUNDS,
  MAX_LSMP_SLOT_COUNT,
  MIN_LSMP_ROUNDS,
  MIN_LSMP_SLOT_COUNT,
} from "@/lib/lista-secreta-mp-constants";

export function ListaSecretaMpLobbyConfig({
  code,
  participantId,
  initialRounds,
  initialSlotCount,
  onSaved,
}: {
  code: string;
  participantId: string;
  initialRounds: number | null;
  initialSlotCount: number | null;
  onSaved: () => void;
}) {
  const [rounds, setRounds] = useState(initialRounds ?? DEFAULT_LSMP_ROUNDS);
  const [slotCount, setSlotCount] = useState(
    initialSlotCount ?? DEFAULT_LSMP_SLOT_COUNT
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch(`/api/sessions/${code}/lista-secreta/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
          totalRounds: rounds,
          slotCount,
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
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={MIN_LSMP_ROUNDS}
            max={MAX_LSMP_ROUNDS}
            value={rounds}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (!Number.isNaN(value)) setRounds(value);
            }}
            className="w-24"
          />
          <input
            type="range"
            min={MIN_LSMP_ROUNDS}
            max={MAX_LSMP_ROUNDS}
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            className="flex-1 accent-gold"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Jogadores secretos por lista
        </label>
        <p className="mb-2 text-xs text-text-muted">
          Mesma lista para os dois — quem acertar pinta o slot com sua cor.
        </p>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={MIN_LSMP_SLOT_COUNT}
            max={MAX_LSMP_SLOT_COUNT}
            value={slotCount}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (!Number.isNaN(value)) setSlotCount(value);
            }}
            className="w-24"
          />
          <input
            type="range"
            min={MIN_LSMP_SLOT_COUNT}
            max={MAX_LSMP_SLOT_COUNT}
            value={slotCount}
            onChange={(e) => setSlotCount(Number(e.target.value))}
            className="flex-1 accent-gold"
          />
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {MIN_LSMP_SLOT_COUNT}–{MAX_LSMP_SLOT_COUNT} jogadores por rodada
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
