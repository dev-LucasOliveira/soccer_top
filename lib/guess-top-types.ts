import type { SessionFilters } from "@/lib/types";

export type GuessTopPublicSlot = {
  slotIndex: 1 | 2 | 3 | 4 | 5;
  hintLabel: string;
  nationality: string;
  position: string;
  showMetaHint: boolean;
  revealed?: {
    playerId: string;
    playerName: string;
    nationality: string;
    position: string;
    hintLabel: string;
  };
};

export type GuessTopPublicRound = {
  challengeId: string;
  title: string;
  description: string;
  searchFilters?: SessionFilters;
  showMetaHint: boolean;
  slots: GuessTopPublicSlot[];
};

export type RevealedSlot = {
  slotIndex: number;
  playerId: string;
  playerName: string;
  nationality: string;
  position: string;
  hintLabel: string;
};

export type GuessTopWrongPick = { playerId: string; playerName: string };

export type GuessTopRecapSlot = {
  slotIndex: number;
  hintLabel: string;
  playerId: string;
  playerName: string;
  nationality: string;
  position: string;
  guessedByPlayer: boolean;
};

export type GuessTopRoundRecap = {
  challengeId: string;
  title: string;
  complete: boolean;
  slots: GuessTopRecapSlot[];
  wrongPicks: GuessTopWrongPick[];
};

export type GuessTopGameRecap = {
  topsCompleted: number;
  errorsUsed: number;
  reason: "errors" | "completed";
  rounds: GuessTopRoundRecap[];
};

export function isGuessTopRoundStale(round: GuessTopPublicRound): boolean {
  return (
    !round.slots?.length ||
    round.slots.some((slot) => !slot.hintLabel)
  );
}
