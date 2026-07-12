"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Target } from "lucide-react";
import { AvailablePlayersCard } from "@/components/available-players-card";
import { UmSoHintsPanel } from "@/components/um-so-hud";
import { TurnTimer } from "@/components/turn-timer";
import { Badge } from "@/components/ui/badge";
import { getGuestToken } from "@/lib/guest";
import { filtersToSearchParams } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { DueloViewState, SessionFilters } from "@/lib/types";

type Player = {
  id: string;
  name: string;
  primaryPosition: string;
  nationality: string;
};

type Participant = {
  id: string;
  displayName: string;
};

function hasDueloViewChanged(
  prev: DueloViewState | null,
  next: DueloViewState
): boolean {
  if (!prev) return true;
  if (prev.roundNumber !== next.roundNumber) return true;
  if (prev.roundStatus !== next.roundStatus) return true;
  if (prev.activeParticipantId !== next.activeParticipantId) return true;
  if (prev.isMyTurn !== next.isMyTurn) return true;
  if (prev.hintsRevealed.length !== next.hintsRevealed.length) return true;
  if (JSON.stringify(prev.scores) !== JSON.stringify(next.scores)) return true;
  if (JSON.stringify(prev.roundsWon) !== JSON.stringify(next.roundsWon)) return true;
  if (JSON.stringify(prev.wrongGuesses) !== JSON.stringify(next.wrongGuesses)) {
    return true;
  }
  if (prev.lastWinner?.participantId !== next.lastWinner?.participantId) return true;
  if (prev.secretReveal?.playerId !== next.secretReveal?.playerId) return true;
  if (prev.turnStartedAt !== next.turnStartedAt) return true;
  if (prev.turnDeadlineAt !== next.turnDeadlineAt) return true;
  return false;
}

function getParticipantShotCount(
  wrongGuesses: DueloViewState["wrongGuesses"],
  participantId: string
) {
  return wrongGuesses.filter((guess) => guess.participantId === participantId).length;
}

export function DueloPlayView({
  sessionCode,
  participantId,
  participants,
  initialView,
}: {
  sessionCode: string;
  participantId: string;
  participants: Participant[];
  initialView: DueloViewState | null;
}) {
  const router = useRouter();
  const [view, setView] = useState<DueloViewState | null>(initialView);
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success" | "duplicate" | "hint" | "round" | "wait" | "final";
    message: string;
  } | null>(null);
  const lastQueryRef = useRef<string | null>(null);

  const roundFiltersKey = JSON.stringify(view?.searchFilters ?? {});

  const fetchSession = useCallback(async () => {
    const res = await fetch(
      `/api/sessions/${sessionCode}?participantId=${participantId}`
    );
    const data = await res.json();
    if (!res.ok) return;

    if (data.status === "completed") {
      router.replace(`/s/${sessionCode}/results`);
      return;
    }

    if (data.dueloView) {
      setView((prev) =>
        hasDueloViewChanged(prev, data.dueloView) ? data.dueloView : prev
      );
    }
  }, [sessionCode, participantId, router]);

  useEffect(() => {
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const handleTurnTimeout = useCallback(async () => {
    if (!view?.isMyTurn || picking) return;

    try {
      const res = await fetch(`/api/sessions/${sessionCode}/duelo/timeout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao processar tempo esgotado");

      if (data.view) setView(data.view);
      setSearch("");
      setPlayers([]);
      setLoading(false);
      lastQueryRef.current = null;

      if (data.sessionCompleted) {
        router.replace(`/s/${sessionCode}/results`);
        return;
      }

      setFeedback({
        type: "wait",
        message: "Tempo esgotado — a vez passou pro oponente.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao processar tempo esgotado",
      });
    }
  }, [view?.isMyTurn, picking, sessionCode, participantId, router]);

  useEffect(() => {
    if (!search || search.length < 2) return;

    const roundFilters = JSON.parse(roundFiltersKey) as SessionFilters;
    const params = filtersToSearchParams(roundFilters);
    params.set("search", search);
    const queryUrl = `/api/players?${params.toString()}`;
    const controller = new AbortController();
    const isNewQuery = lastQueryRef.current !== queryUrl;

    if (isNewQuery) {
      setLoading(true);
      lastQueryRef.current = queryUrl;
    }

    fetch(queryUrl, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data.players ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (lastQueryRef.current === queryUrl) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [search, roundFiltersKey]);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (value.length < 2) {
      setPlayers([]);
      setLoading(false);
      lastQueryRef.current = null;
    }
  }

  async function handlePick(player: Player) {
    if (picking || !view?.isMyTurn) return;
    setPicking(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/sessions/${sessionCode}/duelo/pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
          playerId: player.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao palpitar");

      if (data.duplicate) {
        setFeedback({
          type: "duplicate",
          message: "Você já tentou esse jogador nesta rodada.",
        });
        if (data.view) setView(data.view);
        return;
      }

      if (data.view) setView(data.view);

      if (data.correct) {
        setFeedback({
          type: "success",
          message: `${data.scoring?.tierLabel ?? "Acertou"}! +${data.scoring?.points ?? 0} pts`,
        });
        if (data.sessionCompleted) {
          setTimeout(() => router.replace(`/s/${sessionCode}/results`), 1200);
        } else if (data.roundCompleted) {
          setTimeout(() => {
            setSearch("");
            setPlayers([]);
            setLoading(false);
            lastQueryRef.current = null;
            setFeedback({
              type: "round",
              message: "Rodada encerrada — próximo tema em instantes…",
            });
            fetchSession();
          }, 900);
        }
        return;
      }

      if (data.roundFailed || data.sessionCompleted) {
        setFeedback({
          type: "final",
          message: data.view?.secretReveal
            ? `Ninguém acertou — era ${data.view.secretReveal.playerName}.`
            : "Ninguém acertou — duelo encerrado.",
        });
        setTimeout(() => router.replace(`/s/${sessionCode}/results`), 1500);
        return;
      }

      const newHint = data.view?.hintsRevealed?.at(-1);
      if (newHint && data.view.hintsRevealed.length > (view?.hintsRevealed.length ?? 0)) {
        setFeedback({
          type: "hint",
          message: `Errou — nova dica: ${newHint.label} — ${newHint.text}`,
        });
      } else {
        setFeedback({
          type: "error",
          message: `${player.name} não é o jogador secreto.`,
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao palpitar",
      });
    } finally {
      setPicking(false);
    }
  }

  if (!view) {
    return (
      <p className="loading-pulse text-center text-on-pitch-muted">
        Carregando duelo...
      </p>
    );
  }

  const hintsShown = view.hintsRevealed.length;
  const atLastHint = hintsShown >= view.totalHints;
  const excludedPlayerIds = view.wrongGuesses.map((guess) => guess.playerId);
  const activeParticipant = participants.find((p) => p.id === view.activeParticipantId);
  const lastGuess = view.wrongGuesses.at(-1);
  const isRoundOpen = view.roundStatus === "open";

  return (
    <div>
      {isRoundOpen && (
        <div
          className={cn(
            "mb-4 rounded-2xl border px-4 py-4 shadow-lg",
            view.isMyTurn
              ? "border-gold/50 bg-gold/15 ring-2 ring-gold/30"
              : "border-amber-400/40 bg-amber-500/10 ring-2 ring-amber-400/20"
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 rounded-full p-2.5",
                view.isMyTurn
                  ? "bg-gold/25 text-gold-light"
                  : "bg-amber-500/20 text-amber-200"
              )}
            >
              {view.isMyTurn ? (
                <Target size={20} aria-hidden />
              ) : (
                <Loader2 size={20} className="animate-spin" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-display text-lg",
                  view.isMyTurn ? "text-gold-light" : "text-amber-200"
                )}
              >
                {view.isMyTurn
                  ? "Sua vez — chute agora!"
                  : `Vez de ${view.activeParticipantName}`}
              </p>
              <p className="mt-1 text-sm text-on-pitch-muted">
                {view.isMyTurn
                  ? lastGuess && lastGuess.participantId !== participantId
                    ? `${lastGuess.displayName} errou ${lastGuess.playerName}. Sua chance.`
                    : "Busque o jogador secreto e confirme o palpite."
                  : `${view.activeParticipantName} está escolhendo o palpite…`}
              </p>
              {!view.isMyTurn && lastGuess && (
                <p className="mt-2 text-sm text-off-white">
                  Último chute:{" "}
                  <span className="font-medium text-red-200">{lastGuess.playerName}</span>
                  <span className="text-on-pitch-subtle"> · {lastGuess.displayName}</span>
                </p>
              )}
            </div>
          </div>
          <TurnTimer
            turnDeadlineAt={view.turnDeadlineAt}
            pickTimeLimitSeconds={view.pickTimeLimitSeconds}
            isMyTurn={view.isMyTurn}
            onExpire={() => void handleTurnTimeout()}
          />
        </div>
      )}

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gold-light/80">
              Rodada {view.roundNumber}/{view.totalRounds}
            </p>
            <h2 className="font-display text-xl text-off-white">{view.title}</h2>
            <p className="mt-1 text-sm text-on-pitch-muted">{view.description}</p>
          </div>
          {isRoundOpen && (
            <Badge
              variant={view.isMyTurn ? "gold" : "warning"}
              className="self-start px-3 py-1 text-sm"
            >
              {view.isMyTurn ? "Você joga" : `${activeParticipant?.displayName ?? "Oponente"} joga`}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {participants.map((p) => {
            const isActive = p.id === view.activeParticipantId && isRoundOpen;
            const shotCount = getParticipantShotCount(view.wrongGuesses, p.id);
            const isMe = p.id === participantId;

            return (
              <div
                key={p.id}
                className={cn(
                  "relative rounded-xl px-3 py-3 text-center transition-all",
                  isActive
                    ? "scale-[1.02] bg-gold/20 ring-2 ring-gold shadow-[0_0_24px_rgba(197,162,93,0.25)]"
                    : "bg-off-white/[0.06] ring-1 ring-off-white/10 opacity-80"
                )}
              >
                {isActive && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pitch-dark">
                    Na vez
                  </span>
                )}
                <p className="truncate text-xs text-on-pitch-subtle">
                  {p.displayName}
                  {isMe && " (você)"}
                </p>
                <p className="font-display text-lg text-gold-light">
                  {view.scores[p.id] ?? 0}
                </p>
                <p className="text-xs text-on-pitch-muted">
                  {view.roundsWon[p.id] ?? 0} rodada(s)
                </p>
                {isRoundOpen && (
                  <p
                    className={cn(
                      "mt-1 text-xs font-medium",
                      shotCount > 0 ? "text-red-200" : "text-on-pitch-subtle"
                    )}
                  >
                    {shotCount > 0
                      ? `${shotCount} chute${shotCount > 1 ? "s" : ""} nesta rodada`
                      : isActive
                        ? "ainda não chutou"
                        : "aguardando"}
                  </p>
                )}
              </div>
            );
          })}
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
              {hintsShown}/{view.totalHints}
              {atLastHint && view.roundStatus === "open" && " — última chance"}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: view.totalHints }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  i < hintsShown
                    ? atLastHint && i === view.totalHints - 1
                      ? "bg-amber-400/80"
                      : "bg-gold/70"
                    : "bg-off-white/10"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <UmSoHintsPanel hints={view.hintsRevealed} totalHints={view.totalHints} />

      {view.secretReveal && view.roundStatus !== "open" && (
        <div className="mb-4 rounded-xl border border-pitch-bright/30 bg-pitch-bright/10 px-4 py-3">
          <p className="text-sm text-pitch-bright">
            Jogador secreto: <strong>{view.secretReveal.playerName}</strong>
          </p>
          {view.lastWinner && (
            <p className="mt-1 text-xs text-on-pitch-muted">
              {view.lastWinner.displayName} ganhou {view.lastWinner.points} pts (
              {view.lastWinner.tierLabel})
            </p>
          )}
        </div>
      )}

      {view.roundStatus === "open" && (
        <div className="mb-4 space-y-3">
          <div className="rounded-xl border border-off-white/10 bg-off-white/[0.04] px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-on-pitch-subtle">
              Chutes desta rodada
            </p>
            {view.wrongGuesses.length === 0 ? (
              <p className="mt-2 text-sm text-on-pitch-muted">Nenhum chute ainda</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {view.wrongGuesses.map((guess, index) => (
                  <li
                    key={`${guess.playerId}-${guess.participantId}-${index}`}
                    className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs text-red-200 ring-1 ring-red-400/20"
                  >
                    <span className="font-medium text-off-white">{guess.playerName}</span>
                    <span className="text-red-300/80"> · {guess.displayName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={cn(
              "relative",
              !view.isMyTurn && "pointer-events-none opacity-60"
            )}
          >
            {!view.isMyTurn && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-pitch/70 px-4 text-center backdrop-blur-[1px]">
                <p className="text-sm font-medium text-amber-200">
                  Aguardando {view.activeParticipantName} chutar…
                </p>
              </div>
            )}
            <AvailablePlayersCard
              search={search}
              onSearchChange={handleSearchChange}
              players={players}
              loading={loading}
              canSearch={view.isMyTurn && search.length >= 2}
              topCount={0}
              topN={1}
              excludedPlayerIds={excludedPlayerIds}
              onAddPlayer={handlePick}
            />
          </div>
        </div>
      )}

      {feedback && (
        <p
          className={cn(
            "mb-4 text-sm",
            feedback.type === "error" || feedback.type === "final"
              ? "text-red-300"
              : feedback.type === "duplicate"
                ? "text-on-pitch-muted"
                : "text-pitch-bright"
          )}
          role="status"
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
