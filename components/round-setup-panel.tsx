"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );
  const pendingSaves = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (pendingSaves.current.size === 0) {
      setLocalRounds(rounds);
    }
  }, [rounds]);

  const saveRound = useCallback(
    async (roundId: string, config: RoundConfig) => {
      const guestToken = getGuestToken();
      setSavingIds((prev) => new Set(prev).add(roundId));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[roundId];
        return next;
      });

      try {
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
        onRefresh();
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [roundId]:
            err instanceof Error ? err.message : "Erro ao salvar rodada",
        }));
      } finally {
        pendingSaves.current.delete(roundId);
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(roundId);
          return next;
        });
      }
    },
    [code, participantId, onRefresh]
  );

  function scheduleSave(roundId: string, config: RoundConfig) {
    pendingSaves.current.add(roundId);
    if (debounceTimers.current[roundId]) {
      clearTimeout(debounceTimers.current[roundId]);
    }
    debounceTimers.current[roundId] = setTimeout(() => {
      saveRound(roundId, config);
    }, 400);
  }

  function handleChange(roundId: string, config: RoundConfig) {
    setLocalRounds((prev) =>
      prev.map((round) =>
        round.id === roundId
          ? { ...round, title: config.title, topN: config.topN, filters: config.filters ?? {} }
          : round
      )
    );
    scheduleSave(roundId, config);
  }

  async function handleAddRound() {
    setActionLoading(true);
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

  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

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
              ? "Configure as rodadas antes de iniciar. Alterações são salvas automaticamente."
              : "Acompanhe a configuração feita pelo criador."}
          </p>
        </div>
        {isCreator && localRounds.length < 10 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddRound}
            disabled={actionLoading}
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
          <Button onClick={handleAddRound} disabled={actionLoading}>
            {actionLoading ? "Adicionando..." : "Adicionar primeira rodada"}
          </Button>
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
            {savingIds.has(round.id) && (
              <p className="mt-1 text-xs text-text-muted">Salvando...</p>
            )}
            {errors[round.id] && (
              <p className="mt-1 text-xs text-red-600">{errors[round.id]}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
