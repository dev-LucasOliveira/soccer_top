"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  panelClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { style } = document.body;
    const previous = {
      position: style.position,
      top: style.top,
      width: style.width,
      overflow: style.overflow,
    };

    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";
    style.overflow = "hidden";

    return () => {
      style.position = previous.position;
      style.top = previous.top;
      style.width = previous.width;
      style.overflow = previous.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "fixed inset-0 z-50 m-0 h-full w-full max-h-none max-w-none overflow-y-auto overscroll-contain border-0 bg-transparent p-4 backdrop:bg-black/50 open:flex open:items-start open:justify-center open:py-4 sm:open:items-center",
        className
      )}
    >
      <div
        className={cn(
          "card-football flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden p-5",
          panelClassName
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="dialog-title"
          className="shrink-0 font-display text-lg text-foreground"
        >
          {title}
        </h2>
        <div className="mt-3 flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </dialog>
  );
}
