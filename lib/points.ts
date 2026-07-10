import type { StandingEntry, VoteRankingEntry } from "./types";

const PODIUM_POINTS = [5, 3, 1];

export const PODIUM_POINTS_TABLE = PODIUM_POINTS;

export function pointsForRank(rank: number): number {
  if (rank <= 0 || rank > PODIUM_POINTS.length) return 0;
  return PODIUM_POINTS[rank - 1];
}

export function awardRoundPoints(
  voteRanking: VoteRankingEntry[]
): Record<string, number> {
  const points: Record<string, number> = {};
  for (const entry of voteRanking) {
    points[entry.participantId] = pointsForRank(entry.rank);
  }
  return points;
}

export function accumulateStandings(
  participants: { id: string; displayName: string }[],
  roundPointsList: Record<string, number>[]
): StandingEntry[] {
  const totals = new Map<string, number>();

  for (const participant of participants) {
    totals.set(participant.id, 0);
  }

  for (const roundPoints of roundPointsList) {
    for (const [participantId, pts] of Object.entries(roundPoints)) {
      totals.set(participantId, (totals.get(participantId) ?? 0) + pts);
    }
  }

  return participants
    .map((p) => ({
      participantId: p.id,
      displayName: p.displayName,
      totalPoints: totals.get(p.id) ?? 0,
      rank: 0,
    }))
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        a.displayName.localeCompare(b.displayName)
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
