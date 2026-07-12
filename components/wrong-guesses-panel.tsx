export type WrongGuessEntry = {
  playerId: string;
  playerName: string;
  displayName?: string;
};

export function WrongGuessesPanel({
  guesses,
  title = "Chutes desta rodada",
  emptyLabel = "Nenhum chute ainda",
}: {
  guesses: WrongGuessEntry[];
  title?: string;
  emptyLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-off-white/10 bg-off-white/[0.04] px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-on-pitch-subtle">
        {title}
      </p>
      {guesses.length === 0 ? (
        <p className="mt-2 text-sm text-on-pitch-muted">{emptyLabel}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {guesses.map((guess, index) => (
            <li
              key={`${guess.playerId}-${guess.displayName ?? ""}-${index}`}
              className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-200 ring-1 ring-red-400/20"
            >
              <span className="font-medium text-off-white">{guess.playerName}</span>
              {guess.displayName && (
                <span className="text-red-300/80"> · {guess.displayName}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
