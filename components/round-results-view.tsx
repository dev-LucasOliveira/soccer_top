"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StandingsTable } from "@/components/standings-table";
import { formatListLabel } from "@/lib/voting";
import type { RoundResultData, StandingEntry } from "@/lib/types";

export function RoundResultsView({
  roundResult,
  standings,
  roundNumber,
  totalRounds,
  isLastRound,
}: {
  roundResult: RoundResultData;
  standings: StandingEntry[];
  roundNumber: number;
  totalRounds: number;
  isLastRound: boolean;
}) {
  const ranking = roundResult.voteRanking;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Badge variant="gold" className="mb-2">
          Rodada {roundNumber}/{totalRounds} encerrada
        </Badge>
        <h2 className="text-xl font-bold text-off-white">
          {roundResult.roundTitle}
        </h2>
        {!isLastRound && (
          <p className="mt-2 text-sm text-off-white/70">
            Aguardando criador iniciar a próxima rodada
          </p>
        )}
      </div>

      <StandingsTable
        standings={standings}
        title="Classificação geral (pontos acumulados)"
      />

      <Card>
        <h2 className="mb-4 font-bold text-foreground">
          Resultado desta rodada
        </h2>
        <div className="space-y-3">
          {ranking.map((entry) => (
            <div
              key={entry.participantId}
              className="flex items-center justify-between rounded-xl bg-off-white-muted px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pitch text-sm font-bold text-off-white">
                  {entry.rank}
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    {entry.displayName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatListLabel(entry.alias)} · {entry.voteCount}{" "}
                    {entry.voteCount === 1 ? "voto" : "votos"}
                  </p>
                </div>
              </div>
              <Badge variant="gold">+{entry.points ?? 0} pts</Badge>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {ranking.map((entry) => {
          const top = roundResult.participantTops[entry.participantId];
          if (!top) return null;

          return (
            <Card key={entry.participantId} className="overflow-hidden p-0">
              <div className="flex items-center justify-between bg-pitch px-4 py-3 text-off-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-foreground">
                    {entry.rank}
                  </span>
                  <div>
                    <h3 className="font-bold">{entry.displayName}</h3>
                    <p className="text-xs text-off-white/70">
                      {formatListLabel(entry.alias)}
                    </p>
                  </div>
                </div>
                <Badge variant="gold">+{entry.points ?? 0} pts</Badge>
              </div>
              <div className="space-y-1.5 p-4">
                {top.picks.map((pick) => (
                  <div
                    key={pick.rank}
                    className="flex items-center gap-3 rounded-lg bg-off-white-muted px-3 py-2"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pitch text-xs font-bold text-off-white">
                      {pick.rank}
                    </span>
                    <span className="font-medium text-foreground">
                      {pick.playerName}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
