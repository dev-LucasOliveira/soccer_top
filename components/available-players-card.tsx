import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  onAddPlayer,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  players: Player[];
  loading: boolean;
  canSearch: boolean;
  topCount: number;
  topN: number;
  onAddPlayer: (player: Player) => void;
}) {
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
        ) : players.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-muted">
            Nenhum jogador encontrado
          </p>
        ) : (
          players.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => onAddPlayer(player)}
              disabled={topCount >= topN}
              className="flex w-full items-center justify-between rounded-lg border-b border-card-border/40 px-3 py-2.5 text-left transition-colors duration-200 last:border-0 hover:bg-off-white-muted/80 disabled:opacity-50"
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
  );
}
