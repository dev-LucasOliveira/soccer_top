import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListMessage } from "@/components/list-message";
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
      <div className="card-pitch-header flex items-center justify-between px-4 py-3">
        <div>
          <h3 className="font-display text-base">{heading}</h3>
          <p className="text-xs text-on-pitch-subtle">
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
      <ListMessage message={list.message} />
      <div className="space-y-1.5 p-4">
        {list.picks.map((pick) => (
          <div
            key={pick.rank}
            className="flex items-center gap-3 rounded-lg bg-off-white-muted px-3 py-2"
          >
            <span className="rank-badge-card flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {pick.rank}
            </span>
            <span className="font-medium text-foreground">{pick.playerName}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
