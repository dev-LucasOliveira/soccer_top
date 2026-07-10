import { Card } from "@/components/ui/card";
import type { StandingEntry } from "@/lib/types";

export function StandingsTable({
  standings,
  title = "Classificação",
  highlightLeader = true,
}: {
  standings: StandingEntry[];
  title?: string;
  highlightLeader?: boolean;
}) {
  if (standings.length === 0) return null;

  return (
    <Card>
      <h2 className="mb-4 font-bold text-foreground">{title}</h2>
      <div className="space-y-2">
        {standings.map((entry) => (
          <div
            key={entry.participantId}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
              highlightLeader && entry.rank === 1
                ? "bg-gold/20 ring-1 ring-gold"
                : "bg-off-white-muted"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  entry.rank === 1
                    ? "bg-gold text-foreground"
                    : "bg-pitch text-off-white"
                }`}
              >
                {entry.rank}
              </span>
              <span className="font-medium text-foreground">
                {entry.displayName}
              </span>
            </div>
            <span className="font-bold text-foreground">
              {entry.totalPoints} pts
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
