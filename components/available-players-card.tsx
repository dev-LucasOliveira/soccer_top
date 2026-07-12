import { Ban, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Player = {
  id: string;
  name: string;
  primaryPosition: string;
  nationality: string;
};

export function AvailablePlayersCard({
  search,
  onSearchChange,
  players,
  loading,
  canSearch,
  topCount,
  topN,
  excludedPlayerIds = [],
  pickedPlayerIds = [],
  revealedPlayerIds = [],
  excludedLabel = "Chutado nesta rodada",
  excludedVariant = "wrong",
  onAddPlayer,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  players: Player[];
  loading: boolean;
  canSearch: boolean;
  topCount: number;
  topN: number;
  excludedPlayerIds?: string[];
  pickedPlayerIds?: string[];
  revealedPlayerIds?: string[];
  excludedLabel?: string;
  excludedVariant?: "wrong" | "picked";
  onAddPlayer: (player: Player) => void;
}) {
  const excludedSet = new Set(excludedPlayerIds);
  const pickedSet = new Set(pickedPlayerIds);
  const revealedSet = new Set(revealedPlayerIds);

  const sortedPlayers = [...players].sort((a, b) => {
    const aExcluded =
      excludedSet.has(a.id) || pickedSet.has(a.id) || revealedSet.has(a.id);
    const bExcluded =
      excludedSet.has(b.id) || pickedSet.has(b.id) || revealedSet.has(b.id);
    if (aExcluded === bExcluded) return 0;
    return aExcluded ? 1 : -1;
  });

  return (
    <Card className="space-y-3">
      <h3 className="font-bold text-foreground">Jogadores disponíveis</h3>
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Buscar por nome (mín. 2 letras)..."
      />
      <div className="scroll-subtle max-h-[150px] space-y-0.5 overflow-y-auto">
        {!canSearch ? (
          <p className="py-4 text-center text-sm text-text-muted">
            Digite pelo menos 2 caracteres para buscar jogadores
          </p>
        ) : loading ? (
          <p className="py-4 text-center text-sm text-text-muted">Carregando...</p>
        ) : sortedPlayers.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-muted">
            Nenhum jogador encontrado
          </p>
        ) : (
          sortedPlayers.map((player) => {
            const isRevealed = revealedSet.has(player.id);
            const isPicked = pickedSet.has(player.id);
            const isWrongExcluded =
              excludedSet.has(player.id) && !isRevealed && !isPicked;
            const isExcluded = isRevealed || isPicked || isWrongExcluded;
            const variant = isRevealed
              ? "revealed"
              : isPicked
                ? "picked"
                : excludedVariant;
            const label = isRevealed
              ? "Já revelado"
              : isPicked
                ? "Já no ranking"
                : excludedLabel;
            const isWrong = variant === "wrong";

            return (
              <button
                key={player.id}
                type="button"
                onClick={() => onAddPlayer(player)}
                disabled={topCount >= topN || isExcluded}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg border-b border-card-border/40 px-3 py-2.5 text-left transition-colors duration-200 last:border-0",
                  isExcluded
                    ? isWrong
                      ? "bg-red-500/[0.08] ring-1 ring-inset ring-red-400/25"
                      : isRevealed
                        ? "bg-pitch-bright/[0.08] ring-1 ring-inset ring-pitch-bright/25"
                        : "bg-amber-500/[0.08] ring-1 ring-inset ring-amber-400/25"
                    : "hover:bg-off-white-muted/80",
                  isExcluded && "cursor-not-allowed"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      isExcluded
                        ? isWrong
                          ? "text-red-200/90"
                          : isRevealed
                            ? "text-pitch-bright/90"
                            : "text-amber-200/90"
                        : "text-foreground"
                    )}
                  >
                    {player.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {isExcluded
                      ? label
                      : `${player.primaryPosition} · ${player.nationality}`}
                  </p>
                </div>
                {isExcluded ? (
                  <span
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      isWrong
                        ? "bg-red-500/15 text-red-200 ring-1 ring-red-400/30"
                        : isRevealed
                          ? "bg-pitch-bright/15 text-pitch-bright ring-1 ring-pitch-bright/30"
                          : "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30"
                    )}
                  >
                    {isWrong ? (
                      <>
                        <X size={10} aria-hidden />
                        Chutado
                      </>
                    ) : isRevealed ? (
                      <>
                        <Ban size={10} aria-hidden />
                        Revelado
                      </>
                    ) : (
                      <>
                        <Ban size={10} aria-hidden />
                        No ranking
                      </>
                    )}
                  </span>
                ) : (
                  <Plus size={16} className="shrink-0 text-pitch" />
                )}
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}
