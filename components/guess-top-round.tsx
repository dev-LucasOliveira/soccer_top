"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AvailablePlayersCard } from "@/components/available-players-card";
import { GuessTopHud, GuessTopSlot } from "@/components/guess-top-hud";
import { WrongGuessesPanel } from "@/components/wrong-guesses-panel";
import {
  clearGuessTopClientSession,
  saveGuessTopBest,
  saveGuessTopRecap,
} from "@/lib/guess-top-session";
import type { GuessTopGameRecap } from "@/lib/guess-top-types";
import { filtersToSearchParams } from "@/lib/filters";
import {
  GUESS_TOP_MAX_ERRORS,
  getGuessTopSearchFilters,
} from "@/lib/guess-top-challenges";
import { buildRoundRecap, mergeRoundReveals } from "@/lib/guess-top-recap";
import type {
  GuessTopPublicRound,
  GuessTopRoundRecap,
  GuessTopWrongPick,
  RevealedSlot,
} from "@/lib/guess-top-types";

type Player = {
  id: string;
  name: string;
  primaryPosition: string;
  nationality: string;
};

export function GuessTopRound({
  initialSession,
}: {
  initialSession: {
    sessionToken: string;
    maxErrors: number;
    errorsUsed: number;
    topsCompleted: number;
    roundIndex: number;
    totalRounds: number;
    currentRound: GuessTopPublicRound;
    revealedSlots: RevealedSlot[];
    attemptedPlayerIds: string[];
    gameOver: boolean;
    reason?: "errors" | "completed";
  };
}) {
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState(initialSession.sessionToken);
  const [round, setRound] = useState(initialSession.currentRound);
  const [errorsUsed, setErrorsUsed] = useState(initialSession.errorsUsed);
  const [topsCompleted, setTopsCompleted] = useState(initialSession.topsCompleted);
  const [roundIndex, setRoundIndex] = useState(initialSession.roundIndex);
  const [totalRounds] = useState(initialSession.totalRounds);
  const [revealedBySlot, setRevealedBySlot] = useState<
    Record<number, RevealedSlot>
  >(() =>
    Object.fromEntries(
      initialSession.revealedSlots.map((slot) => [slot.slotIndex, slot])
    )
  );
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success" | "duplicate" | "round";
    message: string;
  } | null>(null);
  const [wrongPicks, setWrongPicks] = useState<GuessTopWrongPick[]>([]);

  const roundHistoryRef = useRef<GuessTopRoundRecap[]>([]);
  const guessedIdsRef = useRef<Set<string>>(new Set());
  const wrongPicksRef = useRef<GuessTopWrongPick[]>([]);

  const goToResult = useCallback(
    (recap: GuessTopGameRecap) => {
      saveGuessTopBest(recap.topsCompleted);
      saveGuessTopRecap(recap);
      clearGuessTopClientSession();
      const params = new URLSearchParams({
        tops: String(recap.topsCompleted),
        errors: String(recap.errorsUsed),
        reason: recap.reason,
      });
      router.push(`/solo/guess/result?${params.toString()}`);
    },
    [router]
  );

  const finalizeCurrentRound = useCallback(
    (
      revealed: Record<number, RevealedSlot>,
      complete: boolean
    ): GuessTopRoundRecap => {
      const merged = mergeRoundReveals(round, revealed);
      return buildRoundRecap(
        merged,
        guessedIdsRef.current,
        wrongPicksRef.current,
        complete
      );
    },
    [round]
  );

  const resetRoundTrackers = useCallback(() => {
    guessedIdsRef.current = new Set();
    wrongPicksRef.current = [];
    setWrongPicks([]);
  }, []);

  const roundFilters = useMemo(
    () =>
      round.searchFilters ??
      getGuessTopSearchFilters(round.challengeId) ??
      {},
    [round.challengeId, round.searchFilters],
  );

  useEffect(() => {
    if (!search || search.length < 2) {
      setPlayers([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const params = filtersToSearchParams(roundFilters);
    params.set("search", search);

    fetch(`/api/players?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data.players ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [search, roundFilters, revealedBySlot]);

  async function handlePick(player: Player) {
    if (picking) return;
    setPicking(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/solo/guess/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, playerId: player.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao palpitar");

      setSessionToken(data.sessionToken);

      if (data.duplicate) {
        setFeedback({
          type: "duplicate",
          message: "Você já tentou esse jogador.",
        });
        return;
      }

      if (!data.correct) {
        const wrongPick = { playerId: player.id, playerName: player.name };
        wrongPicksRef.current.push(wrongPick);
        setWrongPicks((prev) => [...prev, wrongPick]);
        setErrorsUsed(data.errorsUsed);
        setFeedback({
          type: "error",
          message: `${player.name} não está entre os 5 jogadores secretos.`,
        });

        if (data.gameOver) {
          const finalRound = data.finalRoundReveal
            ? buildRoundRecap(
                data.finalRoundReveal,
                guessedIdsRef.current,
                wrongPicksRef.current,
                false
              )
            : finalizeCurrentRound(revealedBySlot, false);

          setTimeout(
            () =>
              goToResult({
                topsCompleted: data.topsCompleted ?? topsCompleted,
                errorsUsed: data.errorsUsed,
                reason: data.reason ?? "errors",
                rounds: [...roundHistoryRef.current, finalRound],
              }),
            1200
          );
        }
        return;
      }

      guessedIdsRef.current.add(player.id);
      const nextRevealed = {
        ...revealedBySlot,
        [data.revealed.slotIndex]: data.revealed,
      };
      setRevealedBySlot(nextRevealed);
      setErrorsUsed(data.errorsUsed);
      setFeedback({
        type: "success",
        message: `Acertou! ${data.revealed.playerName}`,
      });

      if (data.roundComplete) {
        setTopsCompleted(data.topsCompleted);
        setFeedback({
          type: "round",
          message: "Rodada completa! Próximo tema...",
        });

        const completedRound = data.finalRoundReveal
          ? buildRoundRecap(
              data.finalRoundReveal,
              guessedIdsRef.current,
              wrongPicksRef.current,
              true
            )
          : finalizeCurrentRound(nextRevealed, true);

        if (data.gameOver) {
          setTimeout(
            () =>
              goToResult({
                topsCompleted: data.topsCompleted,
                errorsUsed: data.errorsUsed,
                reason: data.reason ?? "completed",
                rounds: [...roundHistoryRef.current, completedRound],
              }),
            1500
          );
          return;
        }

        roundHistoryRef.current.push(completedRound);
        resetRoundTrackers();

        if (data.nextRound) {
          setTimeout(() => {
            setRound(data.nextRound);
            setRoundIndex(data.roundIndex);
            setRevealedBySlot({});
            setSearch("");
            setFeedback(null);
          }, 900);
        }
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

  const revealedCount = Object.keys(revealedBySlot).length;
  const revealedPlayerIds = Object.values(revealedBySlot).map(
    (slot) => slot.playerId
  );
  const excludedPlayerIds = wrongPicks.map((pick) => pick.playerId);

  return (
    <div>
      <GuessTopHud
        round={round}
        errorsUsed={errorsUsed}
        topsCompleted={topsCompleted}
        roundIndex={roundIndex}
        totalRounds={totalRounds}
      />

      {revealedCount < 5 && errorsUsed < GUESS_TOP_MAX_ERRORS && (
        <div className="mb-4 space-y-3">
          <WrongGuessesPanel
            guesses={wrongPicks}
            emptyLabel="Nenhum chute errado ainda"
          />
          <AvailablePlayersCard
            search={search}
            onSearchChange={setSearch}
            players={players}
            loading={loading}
            canSearch={search.length >= 2}
            topCount={revealedCount}
            topN={5}
            excludedPlayerIds={excludedPlayerIds}
            revealedPlayerIds={revealedPlayerIds}
            excludedLabel="Chutado nesta rodada"
            onAddPlayer={handlePick}
          />
        </div>
      )}

      {feedback && (
        <p
          className={`mb-4 text-sm ${
            feedback.type === "error"
              ? "text-red-300"
              : feedback.type === "duplicate"
                ? "text-on-pitch-muted"
                : "text-pitch-bright"
          }`}
          role="status"
        >
          {feedback.message}
        </p>
      )}

      <div className="space-y-2">
        {round.slots.map((slot) => (
          <GuessTopSlot
            key={slot.slotIndex}
            hintLabel={slot.hintLabel}
            nationality={slot.nationality}
            position={slot.position}
            showMetaHint={round.showMetaHint}
            revealed={revealedBySlot[slot.slotIndex]}
          />
        ))}
      </div>
    </div>
  );
}
