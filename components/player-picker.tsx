"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { TopList } from "@/components/top-list";
import { Plus } from "lucide-react";

type Player = {
  id: string;
  name: string;
  primaryPosition: string;
  nationality: string;
};

type TopItem = {
  playerId: string;
  playerName: string;
  position: string;
  nationality: string;
};

export function PlayerPicker({
  sessionCode,
  participantId,
  topN,
  initialPicks,
  confirmed,
}: {
  sessionCode: string;
  participantId: string;
  topN: number;
  initialPicks: TopItem[];
  confirmed: boolean;
}) {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [top, setTop] = useState<TopItem[]>(initialPicks);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ session: sessionCode });
      if (search) params.set("search", search);
      const res = await fetch(`/api/players?${params}`);
      const data = await res.json();
      if (res.ok) setPlayers(data.players);
    } finally {
      setLoading(false);
    }
  }, [sessionCode, search]);

  useEffect(() => {
    const timer = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(timer);
  }, [fetchPlayers]);

  const selectedIds = new Set(top.map((t) => t.playerId));
  const availablePlayers = players.filter((p) => !selectedIds.has(p.id));
  const isComplete = top.length === topN;

  function addPlayer(player: Player) {
    if (top.length >= topN || confirmed) return;
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
    setTop(top.filter((t) => t.playerId !== playerId));
  }

  async function savePicks(confirm = false) {
    setSaving(true);
    setError("");

    try {
      const picks = top.map((item, index) => ({
        playerId: item.playerId,
        rank: index + 1,
      }));

      const res = await fetch(`/api/sessions/${sessionCode}/picks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, picks, confirm }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (confirm) {
        router.push(`/s/${sessionCode}`);
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
        <h2 className="text-lg font-bold text-off-white">
          ⚽ Monte seu ranking de {topN}{" "}
          <span className="text-sm font-normal text-off-white/60">
            ({top.length}/{topN})
          </span>
        </h2>
        {confirmed && (
          <span className="self-start rounded-full bg-pitch-bright/20 px-3 py-1 text-xs font-semibold text-pitch-bright sm:self-auto">
            ✓ Confirmado
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h3 className="font-bold text-foreground">Seu ranking</h3>
          <TopList
            items={top}
            onReorder={setTop}
            onRemove={removePlayer}
            disabled={confirmed}
          />
        </Card>

        {!confirmed && (
          <Card className="space-y-3">
            <h3 className="font-bold text-foreground">Jogadores disponíveis</h3>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
            />
            <div className="max-h-[400px] space-y-1 overflow-y-auto">
              {loading ? (
                <p className="py-4 text-center text-sm text-text-muted">Carregando...</p>
              ) : availablePlayers.length === 0 ? (
                <p className="py-4 text-center text-sm text-text-muted">
                  Nenhum jogador encontrado
                </p>
              ) : (
                availablePlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => addPlayer(player)}
                    disabled={top.length >= topN}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-off-white-muted disabled:opacity-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{player.name}</p>
                      <p className="text-xs text-text-muted">
                        {player.primaryPosition} · {player.nationality}
                      </p>
                    </div>
                    <Plus size={16} className="text-pitch" />
                  </button>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!confirmed && (
        <Button
          onClick={() => savePicks(true)}
          disabled={saving || !isComplete}
          className="w-full"
        >
          {saving ? "Confirmando..." : "Confirmar ranking"}
        </Button>
      )}
    </div>
  );
}
