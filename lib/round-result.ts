import type { RoundResultData, WinningList } from "@/lib/types";

export function getRoundWinningList(
  round: RoundResultData
): WinningList | null {
  const winner = round.voteRanking[0];
  if (!winner) return null;

  const top = round.participantTops[winner.participantId];
  if (!top) return null;

  return {
    roundNumber: round.roundNumber,
    roundTitle: round.roundTitle,
    winnerName: winner.displayName,
    alias: winner.alias,
    voteCount: winner.voteCount,
    message: top.message ?? null,
    picks: top.picks.map((p) => ({
      rank: p.rank,
      playerName: p.playerName,
    })),
  };
}
