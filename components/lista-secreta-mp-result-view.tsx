"use client";

import { useRef, useState } from "react";
import { Check, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExportImagePreviewDialog } from "@/components/export-image-preview-dialog";
import { downloadListaSecretaMpRecapImage } from "@/lib/export-results-image";
import type {
  ListaSecretaMpRoundRecap,
  ListaSecretaMpSessionResult,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function RoundRecapRow({ round }: { round: ListaSecretaMpRoundRecap }) {
  return (
    <div className="rounded-lg bg-off-white/[0.04] px-2.5 py-2 text-sm ring-1 ring-off-white/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-off-white">{round.title}</p>
        {round.winnerDisplayName ? (
          <span className="text-xs text-gold-light">
            {round.winnerDisplayName} · {round.slotWins[round.winnerParticipantId!] ?? 0}{" "}
            slot(s)
          </span>
        ) : (
          <span className="text-xs text-on-pitch-muted">Empate</span>
        )}
      </div>
      <div className="mt-2 space-y-1">
        {round.slots.map((slot) => (
          <p
            key={slot.slotIndex}
            className={cn(
              "text-xs",
              slot.revealed
                ? slot.revealed.ownerColor === "host"
                  ? "text-gold-light"
                  : "text-pitch-bright"
                : "text-on-pitch-subtle"
            )}
          >
            {slot.revealed
              ? `${slot.revealed.playerName} — ${slot.revealed.revealedByDisplayName}`
              : `${slot.hintLabel} (não revelado)`}
          </p>
        ))}
      </div>
    </div>
  );
}

function RecapContent({
  result,
  compact = false,
}: {
  result: ListaSecretaMpSessionResult;
  compact?: boolean;
}) {
  const winner = result.standings[0];
  const isTie =
    result.standings.length >= 2 &&
    result.standings[0].roundsWon === result.standings[1].roundsWon &&
    result.standings[0].totalSlots === result.standings[1].totalSlots;

  return (
    <div className={cn("space-y-5", compact && "space-y-3 text-sm")}>
      <div className="text-center">
        <Badge variant="default" className="mb-3 border-green-400/40 text-green-300">
          Partida completa
        </Badge>
        <p className={cn("font-display text-off-white", compact ? "text-lg" : "text-2xl")}>
          {isTie
            ? "Empate!"
            : winner
              ? `${winner.displayName} venceu`
              : "Resultado final"}
        </p>
        <p className="mt-1 text-xs text-on-pitch-muted">
          Lista Secreta 1v1 — Ranking da Resenha
        </p>
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
              {entry.totalSlots}
            </p>
            <p className="text-xs text-on-pitch-muted">
              slots · {entry.roundsWon} rodada(s)
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
                {round.winnerParticipantId ? (
                  <Check className="h-4 w-4 text-pitch-bright" />
                ) : (
                  <X className="h-4 w-4 text-on-pitch-muted" />
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

export function ListaSecretaMpResultsView({
  result,
  isCreator,
  onRestart,
  restarting,
  restartError,
}: {
  result: ListaSecretaMpSessionResult;
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
      const exportResult = await downloadListaSecretaMpRecapImage(exportRef.current, {
        winnerName: winner?.displayName ?? "lista-secreta",
        totalSlots: winner?.totalSlots ?? 0,
      });

      if (exportResult.status === "preview") {
        setPreviewUrl(exportResult.objectUrl);
        setPreviewFilename(exportResult.filename);
        setPreviewBlob(exportResult.blob);
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
