import { parseFilters } from "./filters";
import type { CurrentRound, RoundSummary } from "./types";

type RoundRecord = {
  id: string;
  number: number;
  title: string;
  topN: number;
  filters: string;
  status: string;
  listAliases?: string | null;
};

type SessionWithRounds = {
  currentRoundNumber: number;
  rounds: RoundRecord[];
};

export function getCurrentRound(session: SessionWithRounds): RoundRecord | null {
  return (
    session.rounds.find((r) => r.number === session.currentRoundNumber) ?? null
  );
}

export function toRoundSummary(round: RoundRecord): RoundSummary {
  return {
    id: round.id,
    number: round.number,
    title: round.title,
    topN: round.topN,
    status: round.status as RoundSummary["status"],
    filters: parseFilters(round.filters),
  };
}

export function toCurrentRound(round: RoundRecord): CurrentRound {
  return toRoundSummary(round);
}

export function mapLegacySessionStatus(
  status: string
): { sessionStatus: string; roundStatus: string } {
  switch (status) {
    case "open":
      return { sessionStatus: "active", roundStatus: "open" };
    case "voting":
      return { sessionStatus: "active", roundStatus: "voting" };
    case "completed":
      return { sessionStatus: "completed", roundStatus: "completed" };
    default:
      return { sessionStatus: status, roundStatus: "pending" };
  }
}
