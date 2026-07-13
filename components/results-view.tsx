"use client";

import { useRef, useState } from "react";
import { Download, Check, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StandingsTable } from "@/components/standings-table";
import { WinningListCard } from "@/components/winning-list-card";
import { ExportImagePreviewDialog } from "@/components/export-image-preview-dialog";
import { downloadResultsImage } from "@/lib/export-results-image";
import { getRoundWinningList } from "@/lib/round-result";
import { formatListLabel } from "@/lib/voting";
import { ListMessage } from "@/components/list-message";
import type { RoundResultData, SessionFinalResult } from "@/lib/types";

function RoundRanking({ roundResult }: { roundResult: RoundResultData }) {
  const ranking = roundResult.voteRanking;

  return (
    <div className="space-y-4">
      {ranking.map((entry) => {
        const top = roundResult.participantTops[entry.participantId];
        if (!top) return null;

        return (
          <Card key={entry.participantId} className="overflow-hidden p-0">
            <div className="card-pitch-header flex items-center justify-between px-4 py-3 text-off-white">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    entry.rank === 1 ? "rank-badge-gold gold-chip" : "rank-badge-card"
                  }`}
                >
                  {entry.rank}
                </span>
                <div>
                  <h3 className="font-bold">{entry.displayName}</h3>
                  <p className="text-xs text-on-pitch-subtle">
                    {formatListLabel(entry.alias)} · {entry.voteCount}{" "}
                    {entry.voteCount === 1 ? "voto" : "votos"} · +{entry.points ?? 0} pts
                  </p>
                </div>
              </div>
            </div>
            <ListMessage message={top.message} />
            <div className="space-y-1.5 p-4">
              {top.picks.map((pick) => (
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
        );
      })}
    </div>
  );
}

export function ResultsView({
  title,
  sessionCode,
  result,
  isCreator,
  onRestart,
  restarting,
  restartError,
  onReturnToLobby,
  returningToLobby,
  returnToLobbyError,
}: {
  title: string;
  sessionCode: string;
  result: SessionFinalResult;
  isCreator?: boolean;
  onRestart?: () => void;
  restarting?: boolean;
  restartError?: string;
  onReturnToLobby?: () => void;
  returningToLobby?: boolean;
  returnToLobbyError?: string;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFilename, setPreviewFilename] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
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
      const result = await downloadResultsImage(exportRef.current, {
        title,
        code: sessionCode,
      });

      if (result.status === "preview") {
        setPreviewUrl(result.objectUrl);
        setPreviewFilename(result.filename);
        setPreviewBlob(result.blob);
        setPreviewOpen(true);
      } else {
        setExported(true);
        setTimeout(() => setExported(false), 2000);
      }
    } catch {
      setExportError("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  function handleClosePreview() {
    setPreviewOpen(false);
    setPreviewUrl("");
    setPreviewFilename("");
    setPreviewBlob(null);
  }

  const leader = result.standings[0];

  return (
    <div className="space-y-6">
      <div ref={exportRef} className="pitch-bg space-y-6 rounded-2xl p-4 sm:p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
            <Trophy size={28} strokeWidth={1.5} className="text-gold" />
          </div>
          <h1 className="font-display text-2xl text-off-white">Resultado Final</h1>
          {leader && (
            <p className="mt-3 text-lg font-medium text-gold">
              Campeão: {leader.displayName} ({leader.totalPoints} pts)
            </p>
          )}
        </div>

        <StandingsTable
          standings={result.standings}
          title="Classificação final"
        />

        {roundNumbers.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg text-off-white">Tops vitoriosos</h2>
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
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
            activeTab === "final"
              ? "border border-gold-dark/35 bg-gradient-to-b from-gold-light to-gold text-gold-foreground shadow-sm"
              : "border border-transparent bg-off-white-muted text-foreground hover:bg-off-white-surface"
          }`}
        >
          Geral
        </button>
        {roundNumbers.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => setActiveTab(num)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === num
                ? "border border-gold-dark/35 bg-gradient-to-b from-gold-light to-gold text-gold-foreground shadow-sm"
                : "border border-transparent bg-off-white-muted text-foreground hover:bg-off-white-surface"
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
            <h2 className="font-display text-lg text-off-white">
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
        {isCreator && (onRestart || onReturnToLobby) && (
          <>
            {onRestart && (
              <Button
                variant="secondary"
                size="lg"
                onClick={onRestart}
                disabled={restarting}
                className="w-full sm:w-auto"
              >
                {restarting ? "Reiniciando..." : "Jogar de novo"}
              </Button>
            )}
            {onReturnToLobby && (
              <Button
                variant="secondary"
                size="lg"
                onClick={onReturnToLobby}
                disabled={returningToLobby}
                className="w-full sm:w-auto"
              >
                {returningToLobby ? "Voltando..." : "Escolher outro modo"}
              </Button>
            )}
          </>
        )}
        {restartError && (
          <p className="text-center text-sm text-red-300">{restartError}</p>
        )}
        {returnToLobbyError && (
          <p className="text-center text-sm text-red-300">{returnToLobbyError}</p>
        )}
      </div>

      <ExportImagePreviewDialog
        open={previewOpen}
        onClose={handleClosePreview}
        objectUrl={previewUrl}
        filename={previewFilename}
        blob={previewBlob}
      />
    </div>
  );
}
