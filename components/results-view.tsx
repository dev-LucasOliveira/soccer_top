"use client";

import { useRef, useState } from "react";
import { Download, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StandingsTable } from "@/components/standings-table";
import { WinningListCard } from "@/components/winning-list-card";
import { downloadResultsImage } from "@/lib/export-results-image";
import { getRoundWinningList } from "@/lib/round-result";
import { formatListLabel } from "@/lib/voting";
import type { RoundResultData, SessionFinalResult } from "@/lib/types";

const PODIUM_STYLES = [
  { medal: "🥇", height: "h-20 sm:h-28", bg: "bg-gold/30", border: "border-gold" },
  { medal: "🥈", height: "h-14 sm:h-20", bg: "bg-off-white-muted", border: "border-card-border" },
  { medal: "🥉", height: "h-12 sm:h-16", bg: "bg-gold/15", border: "border-gold/50" },
];

function RoundRanking({ roundResult }: { roundResult: RoundResultData }) {
  const ranking = roundResult.voteRanking;

  return (
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
                    {formatListLabel(entry.alias)} · {entry.voteCount}{" "}
                    {entry.voteCount === 1 ? "voto" : "votos"} · +{entry.points ?? 0} pts
                  </p>
                </div>
              </div>
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
  );
}

export function ResultsView({
  title,
  sessionCode,
  result,
}: {
  title: string;
  sessionCode: string;
  result: SessionFinalResult;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState("");
  const [activeTab, setActiveTab] = useState<number | "final">("final");

  const roundNumbers = Object.keys(result.rounds)
    .map(Number)
    .sort((a, b) => a - b);

  async function handleExport() {
    if (!exportRef.current) return;

    setExporting(true);
    setExportError("");
    setExported(false);

    try {
      await downloadResultsImage(exportRef.current, {
        title,
        code: sessionCode,
      });
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch {
      setExportError("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  const leader = result.standings[0];

  return (
    <div className="space-y-6">
      <div ref={exportRef} className="space-y-6 rounded-2xl bg-pitch-dark p-4 sm:p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-2xl">
            🏆
          </div>
          <h1 className="text-2xl font-bold text-off-white">Resultado Final</h1>
          <p className="mt-1 text-off-white/70">{title}</p>
          {leader && (
            <p className="mt-3 text-lg font-bold text-gold">
              Campeão: {leader.displayName} ({leader.totalPoints} pts)
            </p>
          )}
        </div>

        <StandingsTable
          standings={result.standings}
          title="Classificação final (pontos do pódio)"
        />

        {roundNumbers.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-off-white">Tops vitoriosos</h2>
            {roundNumbers.map((num) => {
              const winning = getRoundWinningList(result.rounds[num]);
              return winning ? (
                <WinningListCard key={num} list={winning} />
              ) : null;
            })}
          </div>
        )}
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("final")}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "final"
              ? "bg-gold text-foreground"
              : "bg-off-white-muted text-foreground hover:bg-off-white"
          }`}
        >
          Geral
        </button>
        {roundNumbers.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => setActiveTab(num)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === num
                ? "bg-gold text-foreground"
                : "bg-off-white-muted text-foreground hover:bg-off-white"
            }`}
          >
            Rodada {num}
          </button>
        ))}
      </div>

      {activeTab === "final" ? (
        <Card className="p-4">
          <h2 className="mb-4 font-bold text-foreground">Resumo por rodada</h2>
          <div className="space-y-3">
            {result.roundSummaries.map((summary) => (
              <div
                key={summary.roundNumber}
                className="rounded-xl bg-off-white-muted px-3 py-2"
              >
                <p className="font-medium text-foreground">
                  Rodada {summary.roundNumber}: {summary.title}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {Object.entries(summary.pointsByParticipant)
                    .sort(([, a], [, b]) => b - a)
                    .map(([pid, pts]) => {
                      const name =
                        result.standings.find((s) => s.participantId === pid)
                          ?.displayName ?? pid;
                      return (
                        <Badge key={pid} variant="gold">
                          {name}: +{pts}
                        </Badge>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        result.rounds[activeTab] && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-off-white">
              {result.rounds[activeTab].roundTitle}
            </h2>
            <RoundRanking roundResult={result.rounds[activeTab]} />
          </div>
        )
      )}

      <div className="flex flex-col items-center gap-2">
        <Button
          variant="gold"
          size="lg"
          onClick={handleExport}
          disabled={exporting}
          className="w-full sm:w-auto"
        >
          {exported ? <Check size={18} /> : <Download size={18} />}
          {exporting
            ? "Gerando..."
            : exported
              ? "Imagem salva!"
              : "Exportar imagem"}
        </Button>
        {exportError && (
          <p className="text-center text-sm text-red-300">{exportError}</p>
        )}
      </div>
    </div>
  );
}
