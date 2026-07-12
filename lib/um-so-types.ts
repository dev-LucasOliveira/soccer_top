import type { SessionFilters } from "@/lib/types";

export type UmSoHintKind =
  | "continent"
  | "country"
  | "position"
  | "career"
  | "career_start"
  | "career_end"
  | "primary_club"
  | "primary_club_era"
  | "secondary_club"
  | "secondary_club_era";

export type UmSoHintStep = {
  kind: UmSoHintKind;
  label: string;
  text: string;
};

export type UmSoScoreTier =
  | "genial"
  | "incrivel"
  | "mandou_bem"
  | "no_limite"
  | "sobreviveu";

export type UmSoPublicRound = {
  challengeId: string;
  title: string;
  description: string;
  searchFilters?: SessionFilters;
  hintsRevealed: UmSoHintStep[];
  totalHints: number;
};

export type UmSoRoundRecap = {
  challengeId: string;
  title: string;
  playerName: string;
  playerId: string;
  hintsUsed: number;
  points: number;
  tier: UmSoScoreTier;
  tierLabel: string;
  hints: UmSoHintStep[];
  wrongGuesses: { playerId: string; playerName: string }[];
  completed: boolean;
};

export type UmSoGameRecap = {
  score: number;
  streak: number;
  bestStreak: number;
  roundsCompleted: number;
  reason: "failed";
  rounds: UmSoRoundRecap[];
};

export type UmSoBestScore = {
  score: number;
  bestStreak: number;
  date: string;
};

export function tierLabel(tier: UmSoScoreTier): string {
  switch (tier) {
    case "genial":
      return "Genial";
    case "incrivel":
      return "Incrível";
    case "mandou_bem":
      return "Mandou bem";
    case "no_limite":
      return "No limite";
    case "sobreviveu":
      return "Sobreviveu";
  }
}
