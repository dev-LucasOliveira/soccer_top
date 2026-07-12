"use client";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { revokePreviewUrl, shareImageBlob } from "@/lib/deliver-image-download";

export function ExportImagePreviewDialog({
  open,
  onClose,
  objectUrl,
  filename,
  blob,
}: {
  open: boolean;
  onClose: () => void;
  objectUrl: string;
  filename: string;
  blob: Blob | null;
}) {
  const [canShare, setCanShare] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    if (!open || !blob) {
      setCanShare(false);
      return;
    }

    const file = new File([blob], filename, { type: "image/png" });
    setCanShare(Boolean(navigator.canShare?.({ files: [file] })));
  }, [open, blob, filename]);

  function handleClose() {
    revokePreviewUrl(objectUrl);
    onClose();
  }

  async function handleShare() {
    if (!blob) return;

    setSharing(true);
    setShareError("");

    try {
      const shared = await shareImageBlob(blob, filename);
      if (shared) {
        handleClose();
      }
    } catch {
      setShareError("Não foi possível compartilhar. Segure na imagem para salvar.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Imagem pronta"
      panelClassName="max-w-lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Segure na imagem para salvar na galeria ou use o botão de compartilhar.
        </p>

        <div className="overflow-hidden rounded-xl border border-card-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={objectUrl}
            alt="Ranking exportado"
            className="block w-full"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {canShare && (
            <Button
              variant="gold"
              className="w-full"
              onClick={handleShare}
              disabled={sharing}
            >
              <Share2 size={18} />
              {sharing ? "Abrindo..." : "Compartilhar"}
            </Button>
          )}
          <Button variant="secondary" className="w-full" onClick={handleClose}>
            Fechar
          </Button>
        </div>

        {shareError && (
          <p className="text-center text-sm text-red-400">{shareError}</p>
        )}
      </div>
    </Dialog>
  );
}
