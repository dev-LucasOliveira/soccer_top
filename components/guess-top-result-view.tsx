"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Download, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportImagePreviewDialog } from "@/components/export-image-preview-dialog";
import { GUESS_TOP_MAX_ERRORS } from "@/lib/guess-top-challenges";
import { downloadGuessTopRecapImage } from "@/lib/export-results-image";
import { loadGuessTopRecap } from "@/lib/guess-top-session";
import { isoToLabel } from "@/lib/nationality-codes";
import type { GuessTopGameRecap, GuessTopRecapSlot } from "@/lib/guess-top-types";
import { cn } from "@/lib/utils";

function RecapSlotRow({ slot }: { slot: GuessTopRecapSlot }) {
  const guessed = slot.guessedByPlayer;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
        guessed
          ? "bg-pitch-bright/10 ring-1 ring-pitch-bright/30"
          : "bg-amber-500/10 ring-1 ring-amber-400/25",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
          guessed
            ? "bg-pitch-bright/20 text-pitch-bright"
            : "bg-amber-500/20 text-amber-300",
        )}
        aria-hidden
      >
        {guessed ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3 w-3" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-off-white">{slot.playerName}</p>
        <p className="truncate text-xs text-on-pitch-muted">{slot.hintLabel}</p>
        <p className="text-xs text-on-pitch-subtle">
          {slot.position} · {isoToLabel(slot.nationality)}
        </p>
      </div>
    </div>
  );
}

function RecapContent({
  recap,
  compact = false,
}: {
  recap: GuessTopGameRecap;
  compact?: boolean;
}) {
  const title =
    recap.reason === "completed"
      ? "Você completou todos os desafios!"
      : "Suas vidas acabaram";

  return (
    <div className={cn("space-y-5", compact && "space-y-3 text-sm")}>
      <div className="text-center">
        <p className={cn("font-display text-off-white", compact ? "text-lg" : "text-2xl")}>
          {title}
        </p>
        <p className="mt-1 text-xs text-on-pitch-muted">Adivinhe o Top — Ranking da Resenha</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-off-white/[0.06] px-3 py-4 text-center">
          <p className="text-xs uppercase tracking-wide text-on-pitch-subtle">
            Rodadas completas
          </p>
          <p className={cn("font-display text-gold-light", compact ? "text-2xl" : "text-4xl")}>
            {recap.topsCompleted}
          </p>
        </div>
        <div className="rounded-xl bg-off-white/[0.06] px-3 py-4 text-center">
          <p className="text-xs uppercase tracking-wide text-on-pitch-subtle">
            Erros usados
          </p>
          <p className={cn("font-display text-off-white", compact ? "text-2xl" : "text-4xl")}>
            {recap.errorsUsed}/{GUESS_TOP_MAX_ERRORS}
          </p>
        </div>
      </div>

      <div className={cn("space-y-4", compact && "space-y-2.5")}>
        {recap.rounds.map((round, index) => (
          <div
            key={`${round.challengeId}-${index}`}
            className="rounded-xl border border-off-white/10 bg-off-white/[0.03] p-3"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className={cn("font-display text-off-white", compact ? "text-sm" : "text-base")}>
                {round.title}
              </h3>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  round.complete
                    ? "bg-pitch-bright/15 text-pitch-bright"
                    : "bg-amber-500/15 text-amber-300",
                )}
              >
                {round.complete ? "Completa" : "Incompleta"}
              </span>
            </div>

            <div className="space-y-1.5">
              {round.slots.map((slot) => (
                <RecapSlotRow key={slot.slotIndex} slot={slot} />
              ))}
            </div>

            {round.wrongPicks.length > 0 && (
              <p className="mt-2 text-xs text-red-300">
                Errou: {round.wrongPicks.map((pick) => pick.playerName).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GuessTopResultView({
  fallbackTops,
  fallbackErrors,
  fallbackReason,
}: {
  fallbackTops: number;
  fallbackErrors: number;
  fallbackReason: "errors" | "completed";
}) {
  const [recap, setRecap] = useState<GuessTopGameRecap | null>(null);
  const [ready, setReady] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFilename, setPreviewFilename] = useState("");
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  useEffect(() => {
    setRecap(loadGuessTopRecap());
    setReady(true);
  }, []);

  const displayRecap: GuessTopGameRecap = recap ?? {
    topsCompleted: fallbackTops,
    errorsUsed: fallbackErrors,
    reason: fallbackReason,
    rounds: [],
  };

  async function handleExport() {
    if (!exportRef.current) return;

    setExporting(true);
    setExportError("");
    setExported(false);

    try {
      const result = await downloadGuessTopRecapImage(exportRef.current, {
        tops: displayRecap.topsCompleted,
        errors: displayRecap.errorsUsed,
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

  if (!ready) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-center text-on-pitch-muted">Carregando...</p>
      </main>
    );
  }

  const hasDetail = displayRecap.rounds.length > 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="glass-dark rounded-2xl px-5 py-6">
        <RecapContent recap={displayRecap} />

        {!hasDetail && (
          <p className="mt-4 text-center text-sm text-on-pitch-muted">
            O detalhe das rodadas não está disponível — jogue novamente para ver o recap completo.
          </p>
        )}

        {exportError && (
          <p className="mt-4 text-center text-sm text-red-300">{exportError}</p>
        )}

        <div className="mt-6 flex flex-col items-stretch gap-3 sm:items-center">
          {hasDetail && (
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
          )}
          <Link
            href="/solo/guess"
            className="inline-flex w-full items-center justify-center rounded-xl bg-pitch px-4 py-2.5 text-sm font-semibold text-off-white shadow-sm transition-all hover:bg-pitch-dark sm:w-auto sm:min-w-[220px]"
          >
            Jogar de novo
          </Link>
          <Link
            href="/?mode=adivinhe"
            className="text-center text-sm text-on-pitch-muted transition-colors hover:text-off-white"
          >
            ← Voltar ao início
          </Link>
        </div>
      </div>

      {hasDetail && (
        <div aria-hidden className="pointer-events-none fixed -left-[10000px] top-0">
          <div
            ref={exportRef}
            className="pitch-bg w-[640px] rounded-2xl px-6 py-6"
          >
            <RecapContent recap={displayRecap} compact />
          </div>
        </div>
      )}

      <ExportImagePreviewDialog
        open={previewOpen}
        onClose={handleClosePreview}
        objectUrl={previewUrl}
        filename={previewFilename}
        blob={previewBlob}
      />
    </main>
  );
}
