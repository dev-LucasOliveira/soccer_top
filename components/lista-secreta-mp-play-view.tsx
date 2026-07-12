"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Target } from "lucide-react";
import { AvailablePlayersCard } from "@/components/available-players-card";
import { GuessTopSlot } from "@/components/guess-top-hud";
import { TurnTimer } from "@/components/turn-timer";
import { WrongGuessesPanel } from "@/components/wrong-guesses-panel";
import { Badge } from "@/components/ui/badge";
import { getGuestToken } from "@/lib/guest";
import { filtersToSearchParams } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { ListaSecretaMpViewState, SessionFilters } from "@/lib/types";

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

function hasListaSecretaMpViewChanged(
  prev: ListaSecretaMpViewState | null,
  next: ListaSecretaMpViewState
): boolean {
  if (!prev) return true;
  if (prev.roundNumber !== next.roundNumber) return true;
  if (prev.roundStatus !== next.roundStatus) return true;
  if (prev.activeParticipantId !== next.activeParticipantId) return true;
  if (prev.isMyTurn !== next.isMyTurn) return true;
  if (JSON.stringify(prev.slots) !== JSON.stringify(next.slots)) return true;
  if (JSON.stringify(prev.slotWins) !== JSON.stringify(next.slotWins)) return true;
  if (JSON.stringify(prev.roundsWon) !== JSON.stringify(next.roundsWon)) return true;
  if (prev.lastWinner?.participantId !== next.lastWinner?.participantId) return true;
  if (prev.turnStartedAt !== next.turnStartedAt) return true;
  if (prev.turnDeadlineAt !== next.turnDeadlineAt) return true;
  if (JSON.stringify(prev.wrongGuesses) !== JSON.stringify(next.wrongGuesses)) {
    return true;
  }
  return false;
}

function getParticipantWrongCount(
  wrongGuesses: ListaSecretaMpViewState["wrongGuesses"],
  participantId: string
) {
  return wrongGuesses.filter((guess) => guess.participantId === participantId).length;
}

export function ListaSecretaMpPlayView({
  sessionCode,
  participantId,
  participants,
  initialView,
}: {
  sessionCode: string;
  participantId: string;
  participants: Participant[];
  initialView: ListaSecretaMpViewState | null;
}) {
  const router = useRouter();
  const [view, setView] = useState<ListaSecretaMpViewState | null>(initialView);
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success" | "duplicate" | "round" | "wait";
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

    if (data.listaSecretaMpView) {
      setView((prev) =>
        hasListaSecretaMpViewChanged(prev, data.listaSecretaMpView)
          ? data.listaSecretaMpView
          : prev
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
      const res = await fetch(`/api/sessions/${sessionCode}/lista-secreta/timeout`, {
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
      setFeedback({
        type: "wait",
        message: "Tempo esgotado — palpite perdido, vez do oponente.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao processar tempo esgotado",
      });
    }
  }, [view?.isMyTurn, picking, sessionCode, participantId]);

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
      const res = await fetch(`/api/sessions/${sessionCode}/lista-secreta/pick`, {
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
          message: `Acertou! ${player.name} revelado.`,
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

      setFeedback({
        type: "error",
        message: `${player.name} não está na lista secreta.`,
      });
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
        Carregando partida...
      </p>
    );
  }

  const isRoundOpen = view.roundStatus === "open";
  const activeParticipant = participants.find(
    (p) => p.id === view.activeParticipantId
  );
  const lastRevealed = [...view.slots].reverse().find((slot) => slot.revealed);
  const lastGuess = view.wrongGuesses.at(-1);
  const revealedCount = view.slots.filter((slot) => slot.revealed).length;
  const excludedPlayerIds = view.wrongGuesses.map((guess) => guess.playerId);

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
                  ? "Sua vez — palpite agora!"
                  : `Vez de ${view.activeParticipantName}`}
              </p>
              <p className="mt-1 text-sm text-on-pitch-muted">
                {view.isMyTurn
                  ? lastGuess && lastGuess.participantId !== participantId
                    ? `${lastGuess.displayName} errou ${lastGuess.playerName}. Sua chance.`
                    : lastRevealed &&
                        lastRevealed.revealed?.revealedByParticipantId !==
                          participantId
                      ? `${lastRevealed.revealed?.revealedByDisplayName} revelou ${lastRevealed.revealed?.playerName}. Sua chance.`
                      : "Busque um jogador da lista secreta e confirme o palpite."
                  : `${view.activeParticipantName} está escolhendo o palpite…`}
              </p>
              {!view.isMyTurn && lastGuess && (
                <p className="mt-2 text-sm text-off-white">
                  Último chute:{" "}
                  <span className="font-medium text-red-200">{lastGuess.playerName}</span>
                  <span className="text-on-pitch-subtle"> · {lastGuess.displayName}</span>
                </p>
              )}
              {!view.isMyTurn && !lastGuess && lastRevealed?.revealed && (
                <p className="mt-2 text-sm text-off-white">
                  Último acerto:{" "}
                  <span className="font-medium text-pitch-bright">
                    {lastRevealed.revealed.playerName}
                  </span>
                  <span className="text-on-pitch-subtle">
                    {" "}
                    · {lastRevealed.revealed.revealedByDisplayName}
                  </span>
                </p>
              )}
            </div>
          </div>
          {view.pickTimeLimitSeconds && (
            <TurnTimer
              turnDeadlineAt={view.turnDeadlineAt}
              pickTimeLimitSeconds={view.pickTimeLimitSeconds}
              isMyTurn={view.isMyTurn}
              onExpire={() => void handleTurnTimeout()}
            />
          )}
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
              {view.isMyTurn
                ? "Você joga"
                : `${activeParticipant?.displayName ?? "Oponente"} joga`}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {participants.map((p) => {
            const isActive = p.id === view.activeParticipantId && isRoundOpen;
            const slotWins = view.slotWins[p.id] ?? 0;
            const wrongCount = getParticipantWrongCount(view.wrongGuesses, p.id);
            const isMe = p.id === participantId;
            const playerColor = view.playerColors[p.id];

            return (
              <div
                key={p.id}
                className={cn(
                  "relative rounded-xl px-3 py-3 text-center transition-all",
                  isActive
                    ? "scale-[1.02] bg-gold/20 ring-2 ring-gold shadow-[0_0_24px_rgba(197,162,93,0.25)]"
                    : playerColor === "host"
                      ? "bg-gold/10 ring-1 ring-gold/30 opacity-90"
                      : "bg-pitch-bright/10 ring-1 ring-pitch-bright/30 opacity-90"
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
                <p
                  className={cn(
                    "font-display text-lg",
                    playerColor === "host" ? "text-gold-light" : "text-pitch-bright"
                  )}
                >
                  {slotWins}
                </p>
                <p className="text-xs text-on-pitch-muted">
                  acertos nesta rodada · {view.roundsWon[p.id] ?? 0} rodada(s)
                </p>
                {isRoundOpen && (
                  <p
                    className={cn(
                      "mt-1 text-xs font-medium",
                      wrongCount > 0
                        ? "text-red-200"
                        : isActive
                          ? "text-gold-light"
                          : "text-on-pitch-subtle"
                    )}
                  >
                    {wrongCount > 0
                      ? `${wrongCount} chute${wrongCount > 1 ? "s" : ""} errado${wrongCount > 1 ? "s" : ""}`
                      : isActive
                        ? isMe
                          ? "palpite agora"
                          : "escolhendo…"
                        : slotWins > 0
                          ? `${slotWins} revelado${slotWins > 1 ? "s" : ""}`
                          : "aguardando"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <p className="text-xs uppercase tracking-wide text-gold-light/80">
          Lista secreta ({revealedCount}/{view.slots.length} revelados)
        </p>
        {view.slots.map((slot) => (
          <GuessTopSlot
            key={slot.slotIndex}
            hintLabel={slot.hintLabel}
            nationality={slot.nationality}
            position={slot.position}
            showMetaHint={slot.showMetaHint}
            ownerColor={slot.revealed?.ownerColor}
            revealedByDisplayName={slot.revealed?.revealedByDisplayName}
            revealed={
              slot.revealed
                ? {
                    slotIndex: slot.slotIndex,
                    playerId: "",
                    playerName: slot.revealed.playerName,
                    nationality: slot.revealed.nationality,
                    position: slot.revealed.position,
                    hintLabel: slot.revealed.hintLabel,
                  }
                : undefined
            }
          />
        ))}
      </div>

      {isRoundOpen && (
        <div className="mb-4 space-y-3">
          <WrongGuessesPanel
            guesses={view.wrongGuesses}
            emptyLabel="Nenhum chute errado ainda"
          />

          <div
            className={cn(
              "relative",
              !view.isMyTurn && "pointer-events-none opacity-60"
            )}
          >
            {!view.isMyTurn && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-pitch/70 px-4 text-center backdrop-blur-[1px]">
                <p className="text-sm font-medium text-amber-200">
                  Aguardando {view.activeParticipantName} palpitar…
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
            feedback.type === "error"
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
