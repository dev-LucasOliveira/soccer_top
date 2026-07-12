"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Check, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListMessage } from "@/components/list-message";
import { ExportImagePreviewDialog } from "@/components/export-image-preview-dialog";
import { downloadSoloRankingImage } from "@/lib/export-results-image";
import { clearSoloDraft } from "@/lib/solo-draft";
import type { SoloDraft } from "@/lib/types";

export function SoloExportView({ draft }: { draft: SoloDraft }) {
  const router = useRouter();
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
      const result = await downloadSoloRankingImage(exportRef.current, {
        title: draft.title,
        authorName: draft.authorName,
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

  function handleNewRanking() {
    clearSoloDraft();
    router.push("/solo");
  }

  const sortedPicks = [...draft.picks].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-6">
      <div ref={exportRef} className="pitch-bg space-y-6 rounded-2xl p-4 sm:p-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
            <Trophy size={28} strokeWidth={1.5} className="text-gold" />
          </div>
          <h1 className="font-display text-2xl text-off-white">{draft.title}</h1>
          <p className="mt-3 text-lg font-medium text-gold">
            Por {draft.authorName}
          </p>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="card-pitch-header px-4 py-3">
            <h3 className="font-display text-base">Meu Top {draft.topN}</h3>
            <p className="text-xs text-on-pitch-subtle">{draft.title}</p>
          </div>
          <div className="border-b border-card-border px-4 py-2 text-sm text-text-muted">
            {draft.authorName}
          </div>
          <ListMessage message={draft.message} />
          <div className="space-y-1.5 p-4">
            {sortedPicks.map((pick) => (
              <div
                key={pick.rank}
                className="flex items-center gap-3 rounded-lg bg-off-white-muted px-3 py-2"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    pick.rank === 1 ? "rank-badge-gold gold-chip" : "rank-badge-card"
                  }`}
                >
                  {pick.rank}
                </span>
                <span className="font-medium text-foreground">
                  {pick.playerName}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
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
        <Button
          variant="secondary"
          size="lg"
          onClick={() => router.push("/solo/build")}
          className="w-full sm:w-auto"
        >
          Editar ranking
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={handleNewRanking}
          className="w-full sm:w-auto"
        >
          Novo ranking
        </Button>
      </div>

      {exportError && (
        <p className="text-center text-sm text-red-400">{exportError}</p>
      )}

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
