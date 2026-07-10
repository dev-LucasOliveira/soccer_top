import { accumulateStandings, awardRoundPoints } from "./points";
import type {
  RoundResultData,
  SessionFinalResult,
  SessionResultData,
  VoteRankingEntry,
} from "./types";

type PickWithPlayer = {
  rank: number;
  playerId: string;
  player: { id: string; name: string };
};

type ParticipantWithPicks = {
  id: string;
  displayName: string;
  picks: PickWithPlayer[];
};

type VoteRecord = {
  targetParticipantId: string;
};

export function computeVoteRanking(
  participants: ParticipantWithPicks[],
  votes: VoteRecord[],
  aliases: Record<string, string>
): VoteRankingEntry[] {
  const voteCounts = new Map<string, number>();
  for (const vote of votes) {
    voteCounts.set(
      vote.targetParticipantId,
      (voteCounts.get(vote.targetParticipantId) ?? 0) + 1
    );
  }

  return participants
    .map((p) => ({
      participantId: p.id,
      displayName: p.displayName,
      alias: aliases[p.id] ?? p.id,
      voteCount: voteCounts.get(p.id) ?? 0,
      rank: 0,
    }))
    .sort(
      (a, b) =>
        b.voteCount - a.voteCount ||
        a.displayName.localeCompare(b.displayName)
    )
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export function computeSessionResult(
  participants: ParticipantWithPicks[],
  votes: VoteRecord[],
  aliases: Record<string, string>
): SessionResultData {
  const participantTops: SessionResultData["participantTops"] = {};

  for (const participant of participants) {
    participantTops[participant.id] = {
      displayName: participant.displayName,
      picks: participant.picks
        .sort((a, b) => a.rank - b.rank)
        .map((p) => ({
          rank: p.rank,
          playerId: p.playerId,
          playerName: p.player.name,
        })),
    };
  }

  const voteRanking = computeVoteRanking(participants, votes, aliases);

  return {
    participantTops,
    voteRanking,
  };
}

export function computeRoundResult(
  participants: ParticipantWithPicks[],
  votes: VoteRecord[],
  aliases: Record<string, string>,
  roundNumber: number,
  roundTitle: string
): RoundResultData {
  const base = computeSessionResult(participants, votes, aliases);
  const pointsByParticipant = awardRoundPoints(base.voteRanking);

  const voteRanking = base.voteRanking.map((entry) => ({
    ...entry,
    points: pointsByParticipant[entry.participantId] ?? 0,
  }));

  return {
    ...base,
    voteRanking,
    pointsByParticipant,
    roundNumber,
    roundTitle,
  };
}

export function computeSessionFinalResult(
  participants: { id: string; displayName: string }[],
  roundResults: RoundResultData[]
): SessionFinalResult {
  const roundPointsList = roundResults.map((r) => r.pointsByParticipant);
  const standings = accumulateStandings(participants, roundPointsList);

  const rounds: Record<number, RoundResultData> = {};
  for (const result of roundResults) {
    rounds[result.roundNumber] = result;
  }

  return {
    standings,
    roundSummaries: roundResults.map((r) => ({
      roundNumber: r.roundNumber,
      title: r.roundTitle,
      pointsByParticipant: r.pointsByParticipant,
    })),
    rounds,
  };
}
