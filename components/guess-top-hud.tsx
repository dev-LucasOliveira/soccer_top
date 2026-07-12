import { Lock } from "lucide-react";
import { isoToLabel } from "@/lib/nationality-codes";
import { cn } from "@/lib/utils";
import type { RevealedSlot, GuessTopPublicRound } from "@/lib/guess-top-types";
import { GUESS_TOP_MAX_ERRORS } from "@/lib/guess-top-challenges";

export function GuessTopHud({
  round,
  errorsUsed,
  topsCompleted,
  roundIndex,
  totalRounds,
}: {
  round: GuessTopPublicRound;
  errorsUsed: number;
  topsCompleted: number;
  roundIndex: number;
  totalRounds: number;
}) {
  const errorsRemaining = GUESS_TOP_MAX_ERRORS - errorsUsed;

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gold-light/80">
            Rodada {roundIndex + 1} de {totalRounds}
          </p>
          <h2 className="font-display text-xl text-off-white">{round.title}</h2>
          <p className="mt-1 text-sm text-on-pitch-muted">{round.description}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-xs text-on-pitch-subtle">Rodadas</p>
            <p className="font-display text-lg text-gold-light">{topsCompleted}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-on-pitch-subtle">Erros</p>
            <p className="font-display text-lg text-off-white">
              {errorsUsed}/{GUESS_TOP_MAX_ERRORS}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5" aria-label={`${errorsRemaining} erros restantes`}>
        {Array.from({ length: GUESS_TOP_MAX_ERRORS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              i < errorsUsed
                ? "bg-red-400/80"
                : "bg-gold/60 ring-1 ring-gold/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function GuessTopSlot({
  hintLabel,
  nationality,
  position,
  showMetaHint,
  revealed,
  ownerColor,
  revealedByDisplayName,
}: {
  hintLabel: string;
  nationality: string;
  position: string;
  showMetaHint: boolean;
  revealed?: RevealedSlot;
  ownerColor?: "host" | "guest";
  revealedByDisplayName?: string;
}) {
  const isRevealed = Boolean(revealed);
  const isHostReveal = ownerColor === "host";
  const isGuestReveal = ownerColor === "guest";

  return (
    <div
      className={cn(
        "surface-row flex items-center gap-3 rounded-lg p-3 transition-all duration-300",
        isRevealed &&
          isHostReveal &&
          "bg-gold/20 shadow-[0_0_20px_rgba(197,162,93,0.22)] ring-2 ring-gold/60",
        isRevealed &&
          isGuestReveal &&
          "bg-pitch-bright/20 shadow-[0_0_20px_rgba(74,222,128,0.18)] ring-2 ring-pitch-bright/60",
        isRevealed &&
          !ownerColor &&
          "bg-pitch-bright/15 ring-2 ring-pitch-bright/40",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isRevealed
            ? isGuestReveal
              ? "bg-pitch-bright/30 text-pitch-bright"
              : isHostReveal
                ? "bg-gold/35 text-gold-light"
                : "bg-pitch-bright/25 text-pitch-bright"
            : "bg-off-white/10 text-on-pitch-muted",
        )}
        aria-hidden
      >
        {isRevealed ? (
          <span className="text-sm font-bold">✓</span>
        ) : (
          <Lock className="h-3.5 w-3.5" strokeWidth={2.5} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        {isRevealed ? (
          <>
            <p
              className={cn(
                "truncate font-semibold",
                isHostReveal
                  ? "text-gold-light"
                  : isGuestReveal
                    ? "text-pitch-bright"
                    : "text-off-white"
              )}
            >
              {revealed!.playerName}
            </p>
            <p className="text-xs text-on-pitch-muted">{revealed!.hintLabel}</p>
            {showMetaHint && (
              <p className="text-xs text-on-pitch-subtle">
                {revealed!.position} · {isoToLabel(revealed!.nationality)}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="truncate text-sm font-medium text-gold-light">
              {hintLabel || "Dica indisponível"}
            </p>
            <p
              className="select-none truncate text-xs text-on-pitch-muted blur-sm"
              aria-hidden
            >
              Nome oculto
            </p>
            {showMetaHint && (
              <p className="text-xs text-on-pitch-subtle">
                {position} · {isoToLabel(nationality)}
              </p>
            )}
          </>
        )}
      </div>
      {isRevealed && revealedByDisplayName && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            isHostReveal
              ? "bg-gold/25 text-gold-light ring-1 ring-gold/40"
              : isGuestReveal
                ? "bg-pitch-bright/25 text-pitch-bright ring-1 ring-pitch-bright/40"
                : "bg-off-white/10 text-on-pitch-subtle ring-1 ring-off-white/15"
          )}
        >
          {revealedByDisplayName}
        </span>
      )}
    </div>
  );
}
