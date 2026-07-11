"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TopList } from "@/components/top-list";

export const CONFIRM_RANKING_COPY = {
  title: "Confirmou a lista fora de ordem, né?",
  body: "A galera da resenha não vai perdoar, fica ligado!",
  previewLabel: "Ordem atual:",
  cancel: "Cancelar",
  confirm: "Pode mandar",
  confirming: "Confirmando...",
} as const;

type TopItem = {
  playerId: string;
  playerName: string;
  position: string;
  nationality: string;
};

export function ConfirmRankingDialog({
  open,
  onClose,
  onConfirm,
  items,
  confirming,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (items: TopItem[]) => void;
  items: TopItem[];
  confirming: boolean;
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
      title={CONFIRM_RANKING_COPY.title}
      panelClassName="max-w-lg"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <p className="shrink-0 text-sm text-text-muted">
          {CONFIRM_RANKING_COPY.body}
        </p>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <p className="mb-2 shrink-0 text-xs font-medium text-text-muted">
            {CONFIRM_RANKING_COPY.previewLabel}
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
            {CONFIRM_RANKING_COPY.cancel}
          </Button>
          <Button
            variant="gold"
            onClick={() => onConfirm(draftItems)}
            disabled={confirming}
          >
            {confirming
              ? CONFIRM_RANKING_COPY.confirming
              : CONFIRM_RANKING_COPY.confirm}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
