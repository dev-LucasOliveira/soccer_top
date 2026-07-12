"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ImpostorSessionResult } from "@/lib/types";

export function ImpostorResultsView({
  result,
  isCreator,
  onRestart,
  restarting,
  restartError,
}: {
  result: ImpostorSessionResult;
  isCreator?: boolean;
  onRestart?: () => void;
  restarting?: boolean;
  restartError?: string;
}) {
  const crewWon = result.outcome === "crew_win";

  return (
    <div className="space-y-6">
      <Card className="p-6 text-center">
        <Badge
          variant="default"
          className={`mb-3 ${crewWon ? "border-green-400/40 text-green-300" : "border-red-400/40 text-red-300"}`}
        >
          {crewWon ? "Tripulação venceu" : "Impostor venceu"}
        </Badge>
        <h2 className="font-display text-2xl text-foreground">
          O impostor era {result.impostorDisplayName}
        </h2>
        <p className="mt-2 text-sm text-text-muted">Tema: {result.themeTitle}</p>
      </Card>

      {result.eliminations.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 font-display text-lg text-foreground">
            Eliminações
          </h3>
          <div className="space-y-2">
            {result.eliminations.map((item) => (
              <div
                key={item.roundNumber}
                className="rounded-lg bg-off-white-muted px-3 py-2 text-sm"
              >
                <span className="font-medium">Rodada {item.roundNumber}:</span>{" "}
                {item.wasTie
                  ? "Empate — ninguém eliminado"
                  : item.eliminatedDisplayName
                    ? `${item.eliminatedDisplayName} eliminado`
                    : "Sem eliminação"}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(result.participantLists).map(([id, list]) => (
          <Card key={id} className="overflow-hidden p-0">
            <div className="border-b border-card-border px-4 py-3">
              <h3 className="font-bold text-foreground">{list.displayName}</h3>
            </div>
            <div className="space-y-1.5 p-4">
              {list.picks.map((pick) => (
                <div
                  key={pick.rank}
                  className="flex items-center gap-3 rounded-lg bg-off-white-muted px-3 py-2"
                >
                  <span className="rank-badge-card flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                    {pick.rank}
                  </span>
                  <span className="font-medium text-foreground">
                    {pick.playerName}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {isCreator && onRestart && (
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="gold"
            size="lg"
            onClick={onRestart}
            disabled={restarting}
            className="w-full sm:w-auto"
          >
            {restarting ? "Reiniciando..." : "Jogar novamente"}
          </Button>
          {restartError && (
            <p className="text-center text-sm text-red-400">{restartError}</p>
          )}
        </div>
      )}
    </div>
  );
}
