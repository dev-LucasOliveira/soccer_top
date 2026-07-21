"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TopList } from "@/components/top-list";
import { AvailablePlayersCard } from "@/components/available-players-card";
import { ConfirmRankingDialog } from "@/components/confirm-ranking-dialog";
import { TurnTimer } from "@/components/turn-timer";
import { getRankingRoundDeadline } from "@/lib/pick-time-limit";
import { LIST_MESSAGE_MAX_LENGTH } from "@/lib/constants";
import type { TopItem } from "@/lib/types";

type ListAction = "add" | "remove" | "reorder";

type Player = {
  id: string;
  name: string;
  primaryPosition: string;
  nationality: string;
};

export function PlayerPicker({
  sessionCode,
  participantId,
  topN,
  initialPicks,
  initialMessage = "",
  confirmed,
  pickTimeLimitSeconds = null,
  roundOpenedAt = null,
}: {
  sessionCode: string;
  participantId: string;
  topN: number;
  initialPicks: TopItem[];
  initialMessage?: string;
  confirmed: boolean;
  pickTimeLimitSeconds?: number | null;
  roundOpenedAt?: string | null;
}) {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [top, setTop] = useState<TopItem[]>(initialPicks);
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastAction, setLastAction] = useState<ListAction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const roundDeadlineAt = getRankingRoundDeadline(
    roundOpenedAt,
    pickTimeLimitSeconds
  );

  async function handleRoundTimeout() {
    if (confirmed) return;

    try {
      if (top.length > 0) {
        await savePicks(false);
      }

      await fetch(`/api/sessions/${sessionCode}/ranking/timeout`, {
        method: "POST",
      });

      router.push(`/s/${sessionCode}/status`);
      router.refresh();
    } catch {
      router.push(`/s/${sessionCode}/status`);
    }
  }

  const MIN_SEARCH_LENGTH = 2;
  const trimmedSearch = search.trim();
  const canSearch = trimmedSearch.length >= MIN_SEARCH_LENGTH;

  const fetchPlayers = useCallback(async () => {
    if (!canSearch) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ session: sessionCode, search: trimmedSearch });
      const res = await fetch(`/api/players?${params}`);
      const data = await res.json();
      if (res.ok) setPlayers(data.players);
    } finally {
      setLoading(false);
    }
  }, [sessionCode, trimmedSearch, canSearch]);

  useEffect(() => {
    const timer = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(timer);
  }, [fetchPlayers]);

  const pickedPlayerIds = top.map((t) => t.playerId);
  const isComplete = top.length === topN;

  function addPlayer(player: Player) {
    if (top.length >= topN || confirmed) return;
    setLastAction("add");
    setTop([
      ...top,
      {
        playerId: player.id,
        playerName: player.name,
        position: player.primaryPosition,
        nationality: player.nationality,
      },
    ]);
  }

  function removePlayer(playerId: string) {
    if (confirmed) return;
    setLastAction("remove");
    setTop(top.filter((t) => t.playerId !== playerId));
  }

  function handleReorder(items: TopItem[]) {
    setLastAction("reorder");
    setTop(items);
  }

  function handleConfirmClick() {
    if (lastAction === "reorder" || topN === 1) {
      void savePicks(true);
      return;
    }
    setConfirmOpen(true);
  }

  function handleModalConfirm(items: TopItem[]) {
    setTop(items);
    setConfirmOpen(false);
    void savePicks(true, items);
  }

  async function savePicks(confirm = false, itemsOverride?: TopItem[]) {
    setSaving(true);
    setError("");

    const itemsToSave = itemsOverride ?? top;

    try {
      const picks = itemsToSave.map((item, index) => ({
        playerId: item.playerId,
        rank: index + 1,
      }));

      const res = await fetch(`/api/sessions/${sessionCode}/picks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          picks,
          message: message.trim() || null,
          confirm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (confirm) {
        router.push(`/s/${sessionCode}/status`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg text-off-white">
          Monte seu ranking de {topN}{" "}
          <span className="text-sm font-normal text-on-pitch-muted">
            ({top.length}/{topN})
          </span>
        </h2>
        {confirmed && (
          <span className="self-start rounded-full border border-pitch-bright/30 bg-pitch-bright/10 px-3 py-1 text-xs font-medium text-pitch-bright sm:self-auto">
            Confirmado
          </span>
        )}
      </div>

      {!confirmed && (
        <TurnTimer
          turnDeadlineAt={roundDeadlineAt}
          pickTimeLimitSeconds={pickTimeLimitSeconds}
          isMyTurn
          timeLabel="Tempo para montar a lista"
          onExpire={() => void handleRoundTimeout()}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {!confirmed && (
          <AvailablePlayersCard
            search={search}
            onSearchChange={setSearch}
            players={players}
            loading={loading}
            canSearch={canSearch}
            topCount={top.length}
            topN={topN}
            pickedPlayerIds={pickedPlayerIds}
            excludedVariant="picked"
            onAddPlayer={addPlayer}
          />
        )}
        <Card className="space-y-3">
          <h3 className="font-bold text-foreground">Seu ranking</h3>
          <TopList
            items={top}
            onReorder={handleReorder}
            onRemove={removePlayer}
            disabled={confirmed}
          />
        </Card>
      </div>

      {!confirmed && (
        <Card className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="list-message" className="text-sm font-medium text-foreground">
              Mensagem da lista (opcional)
            </label>
            <span className="text-xs text-text-muted">
              {message.length}/{LIST_MESSAGE_MAX_LENGTH}
            </span>
          </div>
          <textarea
            id="list-message"
            value={message}
            onChange={(e) =>
              setMessage(e.target.value.slice(0, LIST_MESSAGE_MAX_LENGTH))
            }
            maxLength={LIST_MESSAGE_MAX_LENGTH}
            rows={2}
            placeholder="Justifique sua lista em poucas palavras..."
            className="w-full resize-none rounded-xl border border-card-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:border-pitch/50 focus:outline-none focus:ring-2 focus:ring-pitch/20"
          />
        </Card>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!confirmed && (
        <Button
          onClick={handleConfirmClick}
          disabled={saving || !isComplete}
          className="w-full"
        >
          {saving ? "Confirmando..." : "Confirmar ranking"}
        </Button>
      )}

      <ConfirmRankingDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleModalConfirm}
        items={top}
        confirming={saving}
      />
    </div>
  );
}
