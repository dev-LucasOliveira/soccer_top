import { Card } from "@/components/ui/card";

export function MyRankingCard({
  roundNumber,
  roundTitle,
  picks,
}: {
  roundNumber: number;
  roundTitle: string;
  picks: { rank: number; playerName: string }[];
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-pitch px-4 py-3 text-off-white">
        <h3 className="font-bold">Seu ranking</h3>
        <p className="text-xs text-off-white/70">
          Rodada {roundNumber}: {roundTitle}
        </p>
      </div>
      <div className="space-y-1.5 p-4">
        {picks.map((pick) => (
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
