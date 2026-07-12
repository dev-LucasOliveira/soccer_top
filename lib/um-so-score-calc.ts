import type { UmSoHintStep, UmSoScoreTier } from "@/lib/um-so-types";
import { tierLabel } from "@/lib/um-so-types";

const HINT_MULTIPLIERS: { maxHintsUsed: number; multiplier: number; tier: UmSoScoreTier }[] =
  [
    { maxHintsUsed: 0, multiplier: 1.0, tier: "genial" },
    { maxHintsUsed: 1, multiplier: 0.75, tier: "incrivel" },
    { maxHintsUsed: 2, multiplier: 0.55, tier: "mandou_bem" },
    { maxHintsUsed: 3, multiplier: 0.4, tier: "no_limite" },
    { maxHintsUsed: 5, multiplier: 0.3, tier: "sobreviveu" },
    { maxHintsUsed: Number.POSITIVE_INFINITY, multiplier: 0.25, tier: "sobreviveu" },
  ];

export function streakMultiplier(streak: number): number {
  if (streak >= 7) return 1.5;
  if (streak >= 5) return 1.3;
  if (streak >= 3) return 1.15;
  return 1.0;
}

export function calculateRoundPoints(
  hintsUsed: number,
  streakAfterRound: number
): { points: number; tier: UmSoScoreTier; tierLabel: string; multiplier: number } {
  const band =
    HINT_MULTIPLIERS.find((entry) => hintsUsed <= entry.maxHintsUsed) ??
    HINT_MULTIPLIERS[HINT_MULTIPLIERS.length - 1]!;
  const streakMult = streakMultiplier(streakAfterRound);
  const points = Math.floor(1000 * band.multiplier * streakMult);

  return {
    points,
    tier: band.tier,
    tierLabel: tierLabel(band.tier),
    multiplier: band.multiplier * streakMult,
  };
}

export function hintsRevealedSlice(
  ladder: UmSoHintStep[],
  hintsRevealed: number
): UmSoHintStep[] {
  return ladder.slice(0, hintsRevealed);
}
