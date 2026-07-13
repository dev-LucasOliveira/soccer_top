"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TopList } from "@/components/top-list";
import type { TopItem } from "@/lib/types";

export const CONFIRM_RANKING_COPY = {
  title: "Confirmou a lista fora de ordem, né?",
  body: "Sem Critério não perdoa lista fora de ordem — confere de novo!",
  previewLabel: "Ordem atual:",
  cancel: "Cancelar",
  confirm: "Pode mandar",
  confirming: "Confirmando...",
} as const;

export const SOLO_CONFIRM_RANKING_COPY = {
  title: "Confirma essa ordem?",
  body: "Dá uma última conferida antes de pré-visualizar.",
  previewLabel: "Ordem atual:",
  cancel: "Voltar",
  confirm: "Pré-visualizar",
  confirming: "Salvando...",
} as const;

export type ConfirmRankingCopy = {
  title: string;
  body: string;
  previewLabel: string;
  cancel: string;
  confirm: string;
  confirming: string;
};

export function ConfirmRankingDialog({
  open,
  onClose,
  onConfirm,
  items,
  confirming,
  copy = CONFIRM_RANKING_COPY,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: TopItem[]) => void;
  items: TopItem[];
  confirming: boolean;
  copy?: ConfirmRankingCopy;
}) {
  const [draftItems, setDraftItems] = useState<TopItem[]>(items);

  useEffect(() => {
    if (open) {
      setDraftItems(items);
    }
  }, [open, items]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={copy.title}
      panelClassName="max-w-lg"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="shrink-0 text-sm text-text-muted">
          {copy.body}
        </p>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <p className="mb-2 shrink-0 text-xs font-medium text-text-muted">
            {copy.previewLabel}
          </p>
          <TopList
            items={draftItems}
            onReorder={setDraftItems}
            onRemove={() => {}}
            showRemove={false}
            scrollContainerClassName="scroll-subtle min-h-0 flex-1 overflow-y-auto"
          />
        </div>

        <div className="mt-5 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={confirming}>
            {copy.cancel}
          </Button>
          <Button
            variant="gold"
            onClick={() => onConfirm(draftItems)}
            disabled={confirming}
          >
            {confirming ? copy.confirming : copy.confirm}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
