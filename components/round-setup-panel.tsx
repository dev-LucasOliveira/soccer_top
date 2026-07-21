"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoundConfigCard } from "@/components/round-config-card";
import { getGuestToken } from "@/lib/guest";
import type { RoundConfig, RoundSummary } from "@/lib/types";
import { Plus, Loader2 } from "lucide-react";

function toRoundConfig(round: RoundSummary): RoundConfig {
  return {
    title: round.title,
    topN: round.topN,
    filters: round.filters,
    pickTimeLimitSeconds: round.pickTimeLimitSeconds ?? null,
  };
}

export function RoundSetupPanel({
  code,
  participantId,
  rounds,
  isCreator,
  onRefresh,
}: {
  code: string;
  participantId: string;
  rounds: RoundSummary[];
  isCreator: boolean;
  onRefresh: () => void;
}) {
  const [localRounds, setLocalRounds] = useState(rounds);
  const [isDirty, setIsDirty] = useState(false);
  const [dirtyRoundIds, setDirtyRoundIds] = useState<Set<string>>(() => new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isDirty || !isCreator) {
      setLocalRounds(rounds);
    }
  }, [rounds, isDirty, isCreator]);

  const saveRound = useCallback(
    async (roundId: string, config: RoundConfig) => {
      const guestToken = getGuestToken();
      const res = await fetch(`/api/sessions/${code}/rounds/${roundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken,
          round: config,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
    },
    [code, participantId]
  );

  function handleChange(roundId: string, config: RoundConfig) {
    setLocalRounds((prev) =>
      prev.map((round) =>
        round.id === roundId
          ? {
              ...round,
              title: config.title,
              topN: config.topN,
              filters: config.filters ?? {},
              pickTimeLimitSeconds: config.pickTimeLimitSeconds ?? null,
            }
          : round
      )
    );
    setDirtyRoundIds((prev) => new Set(prev).add(roundId));
    setIsDirty(true);
    setSaved(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[roundId];
      delete next._global;
      return next;
    });
  }

  async function handleSaveAll() {
    if (!isDirty || dirtyRoundIds.size === 0) return;

    setSaving(true);
    setSaved(false);
    setErrors({});

    const failedRoundIds = new Set<string>();
    const nextErrors: Record<string, string> = {};

    try {
      await Promise.all(
        [...dirtyRoundIds].map(async (roundId) => {
          const round = localRounds.find((entry) => entry.id === roundId);
          if (!round) return;

          if (!round.title.trim()) {
            failedRoundIds.add(roundId);
            nextErrors[roundId] = "Informe o tema da rodada";
            return;
          }

          if (!Number.isFinite(round.topN) || round.topN < 1 || round.topN > 50) {
            failedRoundIds.add(roundId);
            nextErrors[roundId] = "Top de N deve ser entre 1 e 50";
            return;
          }

          try {
            await saveRound(roundId, toRoundConfig(round));
          } catch (err) {
            failedRoundIds.add(roundId);
            nextErrors[roundId] =
              err instanceof Error ? err.message : "Erro ao salvar rodada";
          }
        })
      );

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        setDirtyRoundIds(failedRoundIds);
        setIsDirty(failedRoundIds.size > 0);
        return;
      }

      setIsDirty(false);
      setDirtyRoundIds(new Set());
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddRound() {
    setActionLoading(true);
    setIsDirty(false);
    setDirtyRoundIds(new Set());
    setSaved(false);

    try {
      const guestToken = getGuestToken();
      const res = await fetch(`/api/sessions/${code}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, guestToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefresh();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        _global: err instanceof Error ? err.message : "Erro ao adicionar rodada",
      }));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveRound(roundId: string) {
    setActionLoading(true);

    try {
      const guestToken = getGuestToken();
      const res = await fetch(`/api/sessions/${code}/rounds/${roundId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, guestToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLocalRounds((prev) => prev.filter((round) => round.id !== roundId));
      setDirtyRoundIds((prev) => {
        const next = new Set(prev);
        next.delete(roundId);
        setIsDirty(next.size > 0);
        return next;
      });
      setSaved(false);
      onRefresh();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [roundId]:
          err instanceof Error ? err.message : "Erro ao remover rodada",
      }));
    } finally {
      setActionLoading(false);
    }
  }

  if (!isCreator && localRounds.length === 0) {
    return (
      <Card>
        <p className="text-sm text-text-muted">
          Aguardando criador configurar as rodadas...
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-foreground">
            Rodadas ({localRounds.length})
          </h2>
          <p className="text-xs text-text-muted">
            {isCreator
              ? "Configure as rodadas antes de iniciar. Clique em Salvar para aplicar as alterações."
              : "Acompanhe a configuração feita pelo criador."}
          </p>
        </div>
        {isCreator && localRounds.length < 10 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddRound}
            disabled={actionLoading || saving}
          >
            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Adicionar rodada
          </Button>
        )}
      </div>

      {errors._global && (
        <p className="text-sm text-red-600">{errors._global}</p>
      )}

      {isCreator && localRounds.length === 0 && (
        <div className="rounded-xl bg-off-white-muted px-4 py-6 text-center">
          <p className="mb-3 text-sm text-text-muted">
            Adicione a primeira rodada para começar a configurar.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {localRounds.map((round, index) => (
          <div key={round.id} className="relative">
            <RoundConfigCard
              round={toRoundConfig(round)}
              index={index}
              total={localRounds.length}
              readOnly={!isCreator}
              onChange={(config) => handleChange(round.id, config)}
              onRemove={() => handleRemoveRound(round.id)}
              canRemove={isCreator && localRounds.length > 0}
            />
            {errors[round.id] && (
              <p className="mt-1 text-xs text-red-600">{errors[round.id]}</p>
            )}
          </div>
        ))}
      </div>

      {isCreator && localRounds.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="secondary"
            disabled={!isDirty || saving || actionLoading}
            onClick={() => void handleSaveAll()}
          >
            {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar alterações"}
          </Button>
          {isDirty && !saving && (
            <p className="text-xs text-text-muted">Alterações pendentes</p>
          )}
        </div>
      )}
    </Card>
  );
}
