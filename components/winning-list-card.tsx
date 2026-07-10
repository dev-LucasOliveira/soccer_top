import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatListLabel } from "@/lib/voting";
import type { WinningList } from "@/lib/types";

export function WinningListCard({
  list,
  heading = "Lista vitoriosa",
}: {
  list: WinningList;
  heading?: string;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between bg-pitch px-4 py-3 text-off-white">
        <div>
          <h3 className="font-bold">{heading}</h3>
          <p className="text-xs text-off-white/70">
            Rodada {list.roundNumber}: {list.roundTitle}
          </p>
        </div>
        <Badge variant="gold">
          {list.voteCount} {list.voteCount === 1 ? "voto" : "votos"}
        </Badge>
      </div>
      <div className="border-b border-card-border px-4 py-2 text-sm text-text-muted">
        {list.winnerName} · {formatListLabel(list.alias)}
      </div>
      <div className="space-y-1.5 p-4">
        {list.picks.map((pick) => (
          <div
            key={pick.rank}
            className="flex items-center gap-3 rounded-lg bg-off-white-muted px-3 py-2"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pitch text-xs font-bold text-off-white">
              {pick.rank}
            </span>
            <span className="font-medium text-foreground">{pick.playerName}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
