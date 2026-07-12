"use client";

import { useRef, useState } from "react";
import { Check, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExportImagePreviewDialog } from "@/components/export-image-preview-dialog";
import { downloadDueloRecapImage } from "@/lib/export-results-image";
import type { DueloRoundRecap, DueloSessionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

function RoundRecapRow({ round }: { round: DueloRoundRecap }) {
  return (
    <div
      className={cn(
        "rounded-lg px-2.5 py-2 text-sm",
        round.failed
          ? "bg-amber-500/10 ring-1 ring-amber-400/25"
          : "bg-pitch-bright/10 ring-1 ring-pitch-bright/30"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-off-white">{round.title}</p>
        {round.winnerDisplayName && round.pointsAwarded ? (
          <span className="text-xs text-gold-light">
            {round.winnerDisplayName} · {round.tierLabel} · +{round.pointsAwarded}
          </span>
        ) : (
          <span className="text-xs text-amber-300">Sem vencedor</span>
        )}
      </div>
      <p className="mt-1 truncate text-xs text-on-pitch-muted">
        Secreto: {round.secretPlayerName}
      </p>
      {round.hints.length > 0 && (
        <p className="mt-1 text-xs text-on-pitch-subtle">
          Dicas: {round.hints.map((hint) => `${hint.label}: ${hint.text}`).join(" · ")}
        </p>
      )}
      {round.wrongGuesses.length > 0 && (
        <p className="mt-1 text-xs text-red-300">
          Chutes:{" "}
          {round.wrongGuesses
            .map((guess) => `${guess.playerName} (${guess.displayName})`)
            .join(", ")}
        </p>
      )}
    </div>
  );
}

function RecapContent({
  result,
  compact = false,
}: {
  result: DueloSessionResult;
  compact?: boolean;
}) {
  const winner = result.standings[0];
  const isTie =
    result.standings.length >= 2 &&
    result.standings[0].totalPoints === result.standings[1].totalPoints &&
    result.standings[0].roundsWon === result.standings[1].roundsWon;

  return (
    <div className={cn("space-y-5", compact && "space-y-3 text-sm")}>
      <div className="text-center">
        <Badge
          variant="default"
          className={cn(
            "mb-3",
            result.outcome === "failed"
              ? "border-amber-400/40 text-amber-300"
              : "border-green-400/40 text-green-300"
          )}
        >
          {result.outcome === "failed" ? "Encerrado sem acerto" : "Duelo completo"}
        </Badge>
        <p className={cn("font-display text-off-white", compact ? "text-lg" : "text-2xl")}>
          {isTie
            ? "Empate!"
            : winner
              ? `${winner.displayName} venceu`
              : "Resultado final"}
        </p>
        <p className="mt-1 text-xs text-on-pitch-muted">Duelo — Ranking da Resenha</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {result.standings.map((entry) => (
          <div
            key={entry.participantId}
            className={cn(
              "rounded-xl px-3 py-4 text-center",
              entry.rank === 1 && !isTie
                ? "bg-gold/15 ring-1 ring-gold/30"
                : "bg-off-white/[0.06]"
            )}
          >
            <p className="truncate text-xs text-on-pitch-subtle">{entry.displayName}</p>
            <p className={cn("font-display text-gold-light", compact ? "text-2xl" : "text-3xl")}>
              {entry.totalPoints}
            </p>
            <p className="text-xs text-on-pitch-muted">
              {entry.roundsWon} rodada(s) vencida(s)
            </p>
          </div>
        ))}
      </div>

      {result.rounds.length > 0 && (
        <div className={cn("space-y-3", compact && "space-y-2")}>
          {result.rounds.map((round) => (
            <div
              key={round.roundNumber}
              className="rounded-xl border border-off-white/10 bg-off-white/[0.03] p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                {round.failed || !round.winnerParticipantId ? (
                  <X className="h-4 w-4 text-amber-300" />
                ) : (
                  <Check className="h-4 w-4 text-pitch-bright" />
                )}
                <span className="text-xs text-on-pitch-subtle">
                  Rodada {round.roundNumber}
                </span>
              </div>
              <RoundRecapRow round={round} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DueloResultsView({
  result,
  isCreator,
  onRestart,
  restarting,
  restartError,
}: {
  result: DueloSessionResult;
  isCreator?: boolean;
  onRestart?: () => void;
  restarting?: boolean;
  restartError?: string;
}) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFilename, setPreviewFilename] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  async function handleExport() {
    if (!exportRef.current) return;

    setExporting(true);
    setExportError("");
    setExported(false);

    try {
      const winner = result.standings[0];
      const result2 = await downloadDueloRecapImage(exportRef.current, {
        winnerName: winner?.displayName ?? "duelo",
        winnerPoints: winner?.totalPoints ?? 0,
      });

      if (result2.status === "preview") {
        setPreviewUrl(result2.objectUrl);
        setPreviewFilename(result2.filename);
        setPreviewBlob(result2.blob);
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

  return (
    <div className="space-y-6">
      <Card className="px-5 py-6">
        <RecapContent result={result} />

        {exportError && (
          <p className="mt-4 text-center text-sm text-red-300">{exportError}</p>
        )}

        <div className="mt-6 flex flex-col items-stretch gap-3 sm:items-center">
          <Button
            type="button"
            className="w-full sm:w-auto sm:min-w-[220px]"
            disabled={exporting}
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting
              ? "Gerando imagem..."
              : exported
                ? "Imagem salva!"
                : "Exportar imagem"}
          </Button>

          {isCreator && onRestart && (
            <Button
              variant="gold"
              size="lg"
              onClick={onRestart}
              disabled={restarting}
              className="w-full sm:w-auto"
            >
              {restarting ? "Reiniciando..." : "Jogar novamente"}
            </Button>
          )}
          {restartError && (
            <p className="text-center text-sm text-red-400">{restartError}</p>
          )}
        </div>
      </Card>

      <div aria-hidden className="pointer-events-none fixed -left-[10000px] top-0">
        <div ref={exportRef} className="pitch-bg w-[640px] rounded-2xl px-6 py-6">
          <RecapContent result={result} compact />
        </div>
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
