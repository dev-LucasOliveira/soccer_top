"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TopList } from "@/components/top-list";
import { AvailablePlayersCard } from "@/components/available-players-card";
import {
  ConfirmRankingDialog,
  SOLO_CONFIRM_RANKING_COPY,
} from "@/components/confirm-ranking-dialog";
import { LIST_MESSAGE_MAX_LENGTH } from "@/lib/constants";
import { filtersToSearchParams, formatFiltersSummary } from "@/lib/filters";
import {
  loadSoloDraft,
  picksToTopItems,
  saveSoloDraft,
  topItemsToPicks,
} from "@/lib/solo-draft";
import type { SoloDraft, TopItem } from "@/lib/types";

type ListAction = "add" | "remove" | "reorder";

type Player = {
  id: string;
  name: string;
  primaryPosition: string;
  nationality: string;
};

export function SoloPlayerPicker({ draft }: { draft: SoloDraft }) {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [top, setTop] = useState<TopItem[]>(() =>
    picksToTopItems(draft.picks)
  );
  const [message, setMessage] = useState(draft.message ?? "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastAction, setLastAction] = useState<ListAction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { topN, title, filters } = draft;
  const filtersSummary = formatFiltersSummary(filters);
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
      const params = filtersToSearchParams(
        filters ?? {},
        new URLSearchParams({ search: trimmedSearch })
      );
      const res = await fetch(`/api/players?${params}`);
      const data = await res.json();
      if (res.ok) setPlayers(data.players);
    } finally {
      setLoading(false);
    }
  }, [trimmedSearch, canSearch, filters]);

  useEffect(() => {
    const timer = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(timer);
  }, [fetchPlayers]);

  useEffect(() => {
    async function hydratePicks() {
      const items = picksToTopItems(draft.picks);
      const missingMeta = items.some(
        (item) => !item.position || !item.nationality
      );
      if (!missingMeta || items.length === 0) return;

      const ids = items.map((item) => item.playerId).join(",");
      if (!ids) return;

      try {
        const res = await fetch(`/api/players?ids=${encodeURIComponent(ids)}`);
        const data = await res.json();
        if (!res.ok) return;

        const byId = new Map<string, Player>(
          data.players.map((player: Player) => [player.id, player])
        );

        setTop(
          items.map((item) => {
            const player = byId.get(item.playerId);
            if (!player) return item;
            return {
              ...item,
              position: item.position || player.primaryPosition,
              nationality: item.nationality || player.nationality,
            };
          })
        );
      } catch {
        // ignore hydration errors; list remains usable
      }
    }

    void hydratePicks();
  }, [draft.picks]);

  const pickedPlayerIds = top.map((t) => t.playerId);
  const isComplete = top.length === topN;

  function addPlayer(player: Player) {
    if (top.length >= topN) return;
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
    setLastAction("remove");
    setTop(top.filter((t) => t.playerId !== playerId));
  }

  function handleReorder(items: TopItem[]) {
    setLastAction("reorder");
    setTop(items);
  }

  function handleConfirmClick() {
    if (lastAction === "reorder" || topN === 1) {
      void saveAndContinue(true);
      return;
    }
    setConfirmOpen(true);
  }

  function handleModalConfirm(items: TopItem[]) {
    setTop(items);
    setConfirmOpen(false);
    void saveAndContinue(true, items);
  }

  async function saveAndContinue(
    goToPreview = false,
    itemsOverride?: TopItem[]
  ) {
    setSaving(true);
    setError("");

    const itemsToSave = itemsOverride ?? top;
    const currentDraft = loadSoloDraft();

    if (!currentDraft) {
      setError("Rascunho não encontrado. Volte ao início.");
      setSaving(false);
      return;
    }

    try {
      saveSoloDraft({
        ...currentDraft,
        picks: topItemsToPicks(itemsToSave),
        message: message.trim() || undefined,
      });

      if (goToPreview) {
        router.push("/solo/preview");
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
        <div>
          <h2 className="font-display text-lg text-off-white">
            Monte seu Top {topN}{" "}
            <span className="text-sm font-normal text-on-pitch-muted">
              ({top.length}/{topN})
            </span>
          </h2>
          <p className="mt-1 text-sm text-on-pitch-muted">{title}</p>
          {filtersSummary && (
            <p className="mt-1 text-xs text-on-pitch-muted">
              Filtros: {filtersSummary}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
        <Card className="space-y-3">
          <h3 className="font-bold text-foreground">Seu ranking</h3>
          <TopList items={top} onReorder={handleReorder} onRemove={removePlayer} />
        </Card>
      </div>

      <Card className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="solo-list-message" className="text-sm font-medium text-foreground">
            Mensagem da lista (opcional)
          </label>
          <span className="text-xs text-text-muted">
            {message.length}/{LIST_MESSAGE_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id="solo-list-message"
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        onClick={handleConfirmClick}
        disabled={saving || !isComplete}
        className="w-full"
      >
        {saving ? "Salvando..." : "Pré-visualizar ranking"}
      </Button>

      <ConfirmRankingDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleModalConfirm}
        items={top}
        confirming={saving}
        copy={SOLO_CONFIRM_RANKING_COPY}
      />
    </div>
  );
}
