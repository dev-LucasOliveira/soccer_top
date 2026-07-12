import type {
  GuessTopPublicRound,
  GuessTopRoundRecap,
  GuessTopWrongPick,
  RevealedSlot,
} from "@/lib/guess-top-types";

export function buildRoundRecap(
  round: GuessTopPublicRound,
  guessedPlayerIds: Set<string>,
  wrongPicks: GuessTopWrongPick[],
  complete: boolean
): GuessTopRoundRecap {
  return {
    challengeId: round.challengeId,
    title: round.title,
    complete,
    wrongPicks,
    slots: round.slots.map((slot) => {
      const revealed = slot.revealed;
      return {
        slotIndex: slot.slotIndex,
        hintLabel: revealed?.hintLabel ?? slot.hintLabel,
        playerId: revealed?.playerId ?? "",
        playerName: revealed?.playerName ?? "—",
        nationality: revealed?.nationality ?? slot.nationality,
        position: revealed?.position ?? slot.position,
        guessedByPlayer: revealed
          ? guessedPlayerIds.has(revealed.playerId)
          : false,
      };
    }),
  };
}

export function mergeRoundReveals(
  round: GuessTopPublicRound,
  revealedBySlot: Record<number, RevealedSlot>
): GuessTopPublicRound {
  return {
    ...round,
    slots: round.slots.map((slot) => {
      const revealed = revealedBySlot[slot.slotIndex];
      if (!revealed) return slot;
      return {
        ...slot,
        revealed: {
          playerId: revealed.playerId,
          playerName: revealed.playerName,
          nationality: revealed.nationality,
          position: revealed.position,
          hintLabel: revealed.hintLabel,
        },
      };
    }),
  };
}
