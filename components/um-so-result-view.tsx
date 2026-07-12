"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportImagePreviewDialog } from "@/components/export-image-preview-dialog";
import { downloadUmSoRecapImage } from "@/lib/export-results-image";
import { loadUmSoRecap } from "@/lib/um-so-session";
import type { UmSoGameRecap, UmSoRoundRecap } from "@/lib/um-so-types";
import { cn } from "@/lib/utils";

function RoundRecapRow({ round }: { round: UmSoRoundRecap }) {
  return (
    <div
      className={cn(
        "rounded-lg px-2.5 py-2 text-sm",
        round.completed
          ? "bg-pitch-bright/10 ring-1 ring-pitch-bright/30"
          : "bg-amber-500/10 ring-1 ring-amber-400/25"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-off-white">{round.title}</p>
        {round.completed && round.points > 0 && (
          <span className="text-xs text-gold-light">
            {round.tierLabel} · +{round.points}
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-xs text-on-pitch-muted">
        {round.completed ? round.playerName : `Não descoberto: ${round.playerName}`}
      </p>
      {round.hints.length > 0 && (
        <p className="mt-1 text-xs text-on-pitch-subtle">
          Dicas: {round.hints.map((hint) => `${hint.label}: ${hint.text}`).join(" · ")}
        </p>
      )}
      {round.wrongGuesses.length > 0 && (
        <p className="mt-1 text-xs text-red-300">
          Errou: {round.wrongGuesses.map((pick) => pick.playerName).join(", ")}
        </p>
      )}
    </div>
  );
}

function RecapContent({
  recap,
  compact = false,
}: {
  recap: UmSoGameRecap;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-5", compact && "space-y-3 text-sm")}>
      <div className="text-center">
        <p className={cn("font-display text-off-white", compact ? "text-lg" : "text-2xl")}>
          Não foi dessa vez
        </p>
        <p className="mt-1 text-xs text-on-pitch-muted">Um Só — Ranking da Resenha</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-off-white/[0.06] px-3 py-4 text-center">
          <p className="text-xs uppercase tracking-wide text-on-pitch-subtle">Pontos</p>
          <p className={cn("font-display text-gold-light", compact ? "text-2xl" : "text-4xl")}>
            {recap.score}
          </p>
        </div>
        <div className="rounded-xl bg-off-white/[0.06] px-3 py-4 text-center">
          <p className="text-xs uppercase tracking-wide text-on-pitch-subtle">Streak</p>
          <p className={cn("font-display text-off-white", compact ? "text-2xl" : "text-4xl")}>
            {recap.bestStreak}
          </p>
        </div>
        <div className="rounded-xl bg-off-white/[0.06] px-3 py-4 text-center">
          <p className="text-xs uppercase tracking-wide text-on-pitch-subtle">Acertos</p>
          <p className={cn("font-display text-off-white", compact ? "text-2xl" : "text-4xl")}>
            {recap.roundsCompleted}
          </p>
        </div>
      </div>

      <div className={cn("space-y-3", compact && "space-y-2")}>
        {recap.rounds.map((round, index) => (
          <div
            key={`${round.challengeId}-${index}`}
            className="rounded-xl border border-off-white/10 bg-off-white/[0.03] p-3"
          >
            <div className="mb-2 flex items-center gap-2">
              {round.completed ? (
                <Check className="h-4 w-4 text-pitch-bright" />
              ) : (
                <X className="h-4 w-4 text-amber-300" />
              )}
              <span className="text-xs text-on-pitch-subtle">
                Rodada {index + 1}
              </span>
            </div>
            <RoundRecapRow round={round} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UmSoResultView({
  fallbackScore,
  fallbackStreak,
  fallbackRounds,
}: {
  fallbackScore: number;
  fallbackStreak: number;
  fallbackRounds: number;
}) {
  const [recap, setRecap] = useState<UmSoGameRecap | null>(null);
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
    setRecap(loadUmSoRecap());
    setReady(true);
  }, []);

  const displayRecap: UmSoGameRecap = recap ?? {
    score: fallbackScore,
    streak: fallbackStreak,
    bestStreak: fallbackStreak,
    roundsCompleted: fallbackRounds,
    reason: "failed",
    rounds: [],
  };

  async function handleExport() {
    if (!exportRef.current) return;

    setExporting(true);
    setExportError("");
    setExported(false);

    try {
      const result = await downloadUmSoRecapImage(exportRef.current, {
        score: displayRecap.score,
        bestStreak: displayRecap.bestStreak,
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
            href="/solo/um-so"
            className="inline-flex w-full items-center justify-center rounded-xl bg-pitch px-4 py-2.5 text-sm font-semibold text-off-white shadow-sm transition-all hover:bg-pitch-dark sm:w-auto sm:min-w-[220px]"
          >
            Jogar de novo
          </Link>
          <Link
            href="/solo/um-so"
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
