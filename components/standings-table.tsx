import { Card } from "@/components/ui/card";
import type { StandingEntry } from "@/lib/types";

export function StandingsTable({
  standings,
  title = "Classificação",
  highlightLeader = true,
  roundPointsByParticipant,
}: {
  standings: StandingEntry[];
  title?: string;
  highlightLeader?: boolean;
  roundPointsByParticipant?: Record<string, number>;
}) {
  if (standings.length === 0) return null;

  const showRoundDelta = roundPointsByParticipant != null;

  return (
    <Card>
      <h2 className="mb-1 font-display text-lg text-foreground">{title}</h2>
      {showRoundDelta && (
        <p className="mb-4 text-xs text-text-muted">
          Pontos abaixo do total indicam o ganho nesta rodada.
        </p>
      )}
      {!showRoundDelta && <div className="mb-4" />}
      <div className="space-y-2">
        {standings.map((entry) => {
          const roundDelta =
            roundPointsByParticipant?.[entry.participantId] ?? 0;

          return (
            <div
              key={entry.participantId}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors duration-200 ${
                highlightLeader && entry.rank === 1
                  ? "border border-gold/30 bg-gold/12"
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
              <div className="text-right">
                <p className="font-bold text-foreground">
                  {entry.totalPoints} pts
                </p>
                {showRoundDelta && roundDelta > 0 && (
                  <p className="text-xs text-gold">
                    +{roundDelta} nesta rodada
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
