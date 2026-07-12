"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AvailablePlayersCard } from "@/components/available-players-card";
import { UmSoHintsPanel, UmSoHud } from "@/components/um-so-hud";
import { WrongGuessesPanel } from "@/components/wrong-guesses-panel";
import {
  clearUmSoClientSession,
  saveUmSoBest,
  saveUmSoRecap,
} from "@/lib/um-so-session";
import { filtersToSearchParams } from "@/lib/filters";
import { getGuessTopSearchFilters } from "@/lib/guess-top-challenges";
import type {
  UmSoGameRecap,
  UmSoPublicRound,
  UmSoRoundRecap,
} from "@/lib/um-so-types";

type Player = {
  id: string;
  name: string;
  primaryPosition: string;
  nationality: string;
};

export function UmSoRound({
  initialSession,
}: {
  initialSession: {
    sessionToken: string;
    score: number;
    streak: number;
    roundsCompleted: number;
    currentRound: UmSoPublicRound;
    attemptedPlayerIds: string[];
    gameOver: boolean;
  };
}) {
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState(initialSession.sessionToken);
  const [round, setRound] = useState(initialSession.currentRound);
  const [score, setScore] = useState(initialSession.score);
  const [streak, setStreak] = useState(initialSession.streak);
  const [roundsCompleted, setRoundsCompleted] = useState(
    initialSession.roundsCompleted
  );
  const [bestStreak, setBestStreak] = useState(0);
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success" | "duplicate" | "hint" | "round" | "final";
    message: string;
  } | null>(null);
  const [wrongPicks, setWrongPicks] = useState<
    { playerId: string; playerName: string }[]
  >([]);

  const roundHistoryRef = useRef<UmSoRoundRecap[]>([]);
  const wrongPicksRef = useRef<{ playerId: string; playerName: string }[]>([]);
  const currentHintsRef = useRef(round.hintsRevealed);

  const goToResult = useCallback(
    (recap: UmSoGameRecap) => {
      saveUmSoBest(recap.score, recap.bestStreak);
      saveUmSoRecap(recap);
      clearUmSoClientSession();
      const params = new URLSearchParams({
        score: String(recap.score),
        streak: String(recap.bestStreak),
        rounds: String(recap.roundsCompleted),
      });
      router.push(`/solo/um-so/result?${params.toString()}`);
    },
    [router]
  );

  const finalizeCurrentRound = useCallback(
    (
      completed: boolean,
      secretPlayer?: {
        playerId: string;
        playerName: string;
      },
      hintsUsed = currentHintsRef.current.length,
      points = 0,
      tierLabel = "",
      tier = "sobreviveu" as UmSoRoundRecap["tier"]
    ): UmSoRoundRecap => ({
      challengeId: round.challengeId,
      title: round.title,
      playerName: secretPlayer?.playerName ?? "?",
      playerId: secretPlayer?.playerId ?? "",
      hintsUsed,
      points,
      tier,
      tierLabel,
      hints: [...currentHintsRef.current],
      wrongGuesses: [...wrongPicksRef.current],
      completed,
    }),
    [round.challengeId, round.title]
  );

  const resetRoundTrackers = useCallback(() => {
    wrongPicksRef.current = [];
    setWrongPicks([]);
    currentHintsRef.current = [];
  }, []);

  const roundFilters = useMemo(
    () =>
      round.searchFilters ??
      getGuessTopSearchFilters(round.challengeId) ??
      {},
    [round.challengeId, round.searchFilters]
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
  }, [search, roundFilters]);

  async function handlePick(player: Player) {
    if (picking) return;
    setPicking(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/solo/um-so/pick", {
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

        if (data.hints) {
          currentHintsRef.current = data.hints;
          setRound((prev) => ({
            ...prev,
            hintsRevealed: data.hints,
            totalHints: data.totalHints ?? prev.totalHints,
          }));
        }

        if (data.gameOver) {
          setFeedback({
            type: "final",
            message: `Era ${data.secretReveal?.playerName}. Fim de jogo.`,
          });

          const finalRound = finalizeCurrentRound(
            false,
            data.secretReveal,
            data.hintsRevealed,
            0,
            "",
            "sobreviveu"
          );

          setTimeout(
            () =>
              goToResult({
                score: data.score,
                streak: data.streak,
                bestStreak: data.bestStreak ?? Math.max(bestStreak, data.streak),
                roundsCompleted: data.roundsCompleted,
                reason: "failed",
                rounds: [...roundHistoryRef.current, finalRound],
              }),
            1200
          );
          return;
        }

        if (data.newHint) {
          setFeedback({
            type: "hint",
            message: `Errou — nova dica: ${data.newHint.label} — ${data.newHint.text}`,
          });
        } else {
          setFeedback({
            type: "error",
            message: `${player.name} não é o jogador secreto. Tente de novo!`,
          });
        }

        if (data.atLastHint) {
          setFeedback({
            type: "final",
            message:
              "Última dica revelada — se errar de novo, o jogo acaba!",
          });
        }
        return;
      }

      setScore(data.score);
      setStreak(data.streak);
      setBestStreak(data.bestStreak);
      setRoundsCompleted(data.roundsCompleted);

      setFeedback({
        type: "success",
        message: `${data.tierLabel}! +${data.roundPoints} pts — ${data.secretPlayer.playerName}`,
      });

      const completedRound = finalizeCurrentRound(
        true,
        data.secretPlayer,
        data.hintsUsed,
        data.roundPoints,
        data.tierLabel,
        data.tier
      );

      roundHistoryRef.current.push(completedRound);
      resetRoundTrackers();

      if (data.nextRound) {
        setTimeout(() => {
          setRound(data.nextRound);
          setSearch("");
          setWrongPicks([]);
          wrongPicksRef.current = [];
          currentHintsRef.current = [];
          setFeedback({
            type: "round",
            message: "Próximo jogador misterioso!",
          });
        }, 900);
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

  const excludedPlayerIds = wrongPicks.map((pick) => pick.playerId);

  return (
    <div>
      <UmSoHud
        round={round}
        score={score}
        streak={streak}
        roundsCompleted={roundsCompleted}
        wrongShotsThisRound={wrongPicks.length}
      />

      <UmSoHintsPanel
        hints={round.hintsRevealed}
        totalHints={round.totalHints}
      />

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
          topCount={0}
          topN={1}
          excludedPlayerIds={excludedPlayerIds}
          excludedLabel="Chutado nesta rodada"
          onAddPlayer={handlePick}
        />
      </div>

      {feedback && (
        <p
          className={`mb-4 text-sm ${
            feedback.type === "error" || feedback.type === "final"
              ? "text-red-300"
              : feedback.type === "hint"
                ? "text-amber-200"
              : feedback.type === "duplicate"
                ? "text-on-pitch-muted"
                : "text-pitch-bright"
          }`}
          role="status"
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
