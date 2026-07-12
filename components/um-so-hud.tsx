import { cn } from "@/lib/utils";
import type { UmSoPublicRound } from "@/lib/um-so-types";

export function UmSoHud({
  round,
  score,
  streak,
  roundsCompleted,
}: {
  round: UmSoPublicRound;
  score: number;
  streak: number;
  roundsCompleted: number;
}) {
  const hintsShown = round.hintsRevealed.length;
  const totalHints = round.totalHints;
  const atLastHint = hintsShown >= totalHints;

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gold-light/80">
            Rodada {roundsCompleted + 1}
          </p>
          <h2 className="font-display text-xl text-off-white">{round.title}</h2>
          <p className="mt-1 text-sm text-on-pitch-muted">{round.description}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="text-xs text-on-pitch-subtle">Pontos</p>
            <p className="font-display text-lg text-gold-light">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-on-pitch-subtle">Streak</p>
            <p className="font-display text-lg text-off-white">
              {streak > 0 ? `🔥 ${streak}` : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-on-pitch-subtle">Nível de dicas</span>
          <span
            className={cn(
              "font-medium",
              atLastHint ? "text-amber-300" : "text-gold-light/90"
            )}
          >
            {hintsShown}/{totalHints}
            {atLastHint && " — última chance"}
          </span>
        </div>
        <div
          className="flex gap-1"
          aria-label={`${hintsShown} de ${totalHints} dicas reveladas`}
        >
          {Array.from({ length: totalHints }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                i < hintsShown
                  ? atLastHint && i === totalHints - 1
                    ? "bg-amber-400/80"
                    : "bg-gold/70"
                  : "bg-off-white/10"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function UmSoHintsPanel({
  hints,
  totalHints,
}: {
  hints: UmSoPublicRound["hintsRevealed"];
  totalHints: number;
}) {
  if (hints.length === 0) {
    return (
      <div className="mb-4 rounded-xl border border-off-white/10 bg-off-white/[0.03] px-4 py-3">
        <p className="text-sm text-on-pitch-muted">
          Nenhuma dica ainda — chute à vontade só com o tema!
        </p>
        <p className="mt-1 text-xs text-on-pitch-subtle">
          Cada erro revela a próxima pista até a última. Errou com todas as dicas
          visíveis → fim de jogo.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 space-y-2">
      <p className="text-xs uppercase tracking-wide text-gold-light/80">
        Dicas ({hints.length}/{totalHints})
      </p>
      {hints.map((hint, index) => (
        <div
          key={`${hint.kind}-${index}`}
          className="surface-row rounded-lg px-3 py-2.5"
        >
          <p className="text-xs text-on-pitch-subtle">{hint.label}</p>
          <p className="text-sm font-medium text-gold-light">{hint.text}</p>
        </div>
      ))}
    </div>
  );
}
