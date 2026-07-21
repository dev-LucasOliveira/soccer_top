import { validateRankingRoundTimeLimit } from "@/lib/pick-time-limit";
import type { RoundConfig } from "@/lib/types";

export function validateRoundConfig(
  round: Partial<RoundConfig>,
  label = "Rodada"
): string | null {
  if (!round.title?.trim()) {
    return `${label}: título é obrigatório`;
  }
  if (!round.topN || round.topN < 1 || round.topN > 50) {
    return `${label}: Top de N deve ser entre 1 e 50`;
  }

  if (round.pickTimeLimitSeconds !== undefined) {
    try {
      validateRankingRoundTimeLimit(round.pickTimeLimitSeconds);
    } catch (err) {
      return err instanceof Error ? err.message : `${label}: limite de tempo inválido`;
    }
  }

  return null;
}

export function areRoundsValid(
  rounds: { title: string; topN: number }[]
): boolean {
  return (
    rounds.length >= 1 &&
    rounds.every(
      (round, index) =>
        validateRoundConfig(round, `Rodada ${index + 1}`) === null
    )
  );
}
