export type Position = "Goleiro" | "Defensor" | "Meia" | "Atacante";

export type SessionFilters = {
  positions?: Position[];
  nationalities?: string[];
  teams?: string[];
  eraStart?: number;
  eraEnd?: number;
};

export type RoundConfig = {
  title: string;
  topN: number;
  filters?: SessionFilters;
};

export type TeamEntry = {
  name: string;
  from: number;
  to: number;
};

export type SeedPlayer = {
  name: string;
  primaryPosition: Position;
  nationality: string;
  teams: TeamEntry[];
  careerStart: number;
  careerEnd: number;
  curatedLists: string[];
};

export type VoteRankingEntry = {
  participantId: string;
  displayName: string;
  alias: string;
  voteCount: number;
  rank: number;
  points?: number;
};

export type SessionResultData = {
  participantTops: Record<
    string,
    {
      displayName: string;
      message?: string | null;
      picks: { rank: number; playerId: string; playerName: string }[];
    }
  >;
  voteRanking: VoteRankingEntry[];
};

export type RoundResultData = SessionResultData & {
  pointsByParticipant: Record<string, number>;
  roundNumber: number;
  roundTitle: string;
};

export type StandingEntry = {
  participantId: string;
  displayName: string;
  totalPoints: number;
  rank: number;
};

export type WinningList = {
  roundNumber: number;
  roundTitle: string;
  winnerName: string;
  alias: string;
  voteCount: number;
  message?: string | null;
  picks: { rank: number; playerName: string }[];
};

export type SessionFinalResult = {
  standings: StandingEntry[];
  roundSummaries: {
    roundNumber: number;
    title: string;
    pointsByParticipant: Record<string, number>;
  }[];
  rounds: Record<number, RoundResultData>;
};

export type ListAliases = Record<string, string>;

export type AnonymousPick = {
  rank: number;
  playerName: string;
  position: string;
  nationality: string;
};

export type AnonymousList = {
  alias: string;
  message?: string | null;
  picks: AnonymousPick[];
  voteCount: number;
};

export type VoteState = {
  lists: AnonymousList[];
  myAlias: string | null;
  hasVoted: boolean;
  votedAlias: string | null;
  totalVoters: number;
  votedCount: number;
  roundNumber: number;
  roundTitle: string;
  isSpectator?: boolean;
};

export type ParticipantStatus = "building" | "confirmed" | "spectator";
export type SessionStatus = "setup" | "active" | "completed";
export type RoundStatus = "pending" | "open" | "voting" | "completed";

export type RoundSummary = {
  id: string;
  number: number;
  title: string;
  topN: number;
  status: RoundStatus;
  filters: SessionFilters;
};

export type CurrentRound = RoundSummary & {
  listAliases?: ListAliases;
};
