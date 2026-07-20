export const IMPOSTOR_TOTAL_ROUNDS = 3;
export const IMPOSTOR_TOP_N = 5;
export const MIN_IMPOSTOR_PLAYERS = 4;

/** Each round uses its own theme; players always complete rank 3 of that round's list. */
export const IMPOSTOR_TARGET_RANKS = [3, 3, 3] as const;

export function getImpostorTargetRank(roundNumber: number): number {
  return IMPOSTOR_TARGET_RANKS[roundNumber - 1] ?? 5;
}
