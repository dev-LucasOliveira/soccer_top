export type Position = "Goleiro" | "Defensor" | "Meia" | "Atacante";

import type { UmSoHintStep } from "@/lib/um-so-types";

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

export type TopItem = {
  playerId: string;
  playerName: string;
  position: string;
  nationality: string;
};

export type TopPick = {
  rank: number;
  playerId: string;
  playerName: string;
  position?: string;
  nationality?: string;
};

export type SoloDraft = {
  authorName: string;
  title: string;
  topN: number;
  picks: TopPick[];
  message?: string;
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
export type GameMode =
  | "lobby"
  | "ranking"
  | "impostor"
  | "duelo"
  | "lista-secreta-mp";

export type PlayableGameMode = Exclude<GameMode, "lobby">;

export type RoundStatus =
  | "pending"
  | "open"
  | "reveal"
  | "voting"
  | "completed"
  | "failed";

export type ImpostorThemeSummary = {
  id: string;
  title: string;
  description: string;
};

export type ImpostorCard = {
  playerId: string;
  playerName: string;
  position: string;
  nationality: string;
};

export type ImpostorListPick = {
  rank: number;
  playerId: string;
  playerName: string;
};

export type ImpostorParticipantList = {
  participantId: string;
  displayName: string;
  status: ParticipantStatus;
  picks: ImpostorListPick[];
  hasConfirmed: boolean;
};

export type ImpostorViewState = {
  themeTitle: string | null;
  isImpostor: boolean;
  roundNumber: number;
  totalRounds: number;
  targetRank: number;
  roundStatus: RoundStatus;
  myPicks: ImpostorListPick[];
  cardOptions: ImpostorCard[];
  hasConfirmed: boolean;
  participantLists: ImpostorParticipantList[];
};

export type ImpostorElimination = {
  roundNumber: number;
  eliminatedParticipantId: string | null;
  eliminatedDisplayName: string | null;
  wasTie: boolean;
};

export type ImpostorSessionResult = {
  outcome: "crew_win" | "impostor_win";
  impostorParticipantId: string;
  impostorDisplayName: string;
  themeTitle: string;
  eliminations: ImpostorElimination[];
  participantLists: Record<
    string,
    { displayName: string; picks: { rank: number; playerName: string }[] }
  >;
};

export type ImpostorVoteState = {
  participants: {
    id: string;
    displayName: string;
    status: ParticipantStatus;
  }[];
  hasVoted: boolean;
  votedTargetId: string | null;
  totalVoters: number;
  votedCount: number;
  roundNumber: number;
  isSpectator: boolean;
};

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

export type DueloWrongGuess = {
  participantId: string;
  playerId: string;
  playerName: string;
};

export type DueloWrongGuessView = {
  participantId: string;
  displayName: string;
  playerId: string;
  playerName: string;
};

export type DueloRoundPayload = {
  challengeId: string;
  secretPlayerId: string;
  hintsRevealed: number;
  hintLadder: UmSoHintStep[];
  playerOrder: [string, string];
  activeParticipantId: string;
  phase: "open" | "completed" | "failed";
  winnerParticipantId?: string;
  pointsAwarded?: number;
  tierLabel?: string;
  tier?: string;
  hintsUsed?: number;
  wrongGuesses: DueloWrongGuess[];
  secretPlayerName?: string;
  turnStartedAt?: string;
};

export type DueloRoundRecap = {
  roundNumber: number;
  title: string;
  challengeId: string;
  winnerParticipantId?: string;
  winnerDisplayName?: string;
  pointsAwarded?: number;
  tierLabel?: string;
  hintsUsed?: number;
  secretPlayerName: string;
  secretPlayerId: string;
  hints: UmSoHintStep[];
  failed: boolean;
  wrongGuesses: DueloWrongGuessView[];
};

export type DueloStandingEntry = {
  participantId: string;
  displayName: string;
  totalPoints: number;
  roundsWon: number;
  rank: number;
};

export type DueloSessionResult = {
  outcome: "completed" | "failed";
  standings: DueloStandingEntry[];
  rounds: DueloRoundRecap[];
};

export type DueloViewState = {
  roundNumber: number;
  totalRounds: number;
  title: string;
  description: string;
  searchFilters?: SessionFilters;
  hintsRevealed: UmSoHintStep[];
  totalHints: number;
  activeParticipantId: string;
  activeParticipantName: string;
  isMyTurn: boolean;
  roundStatus: "open" | "completed" | "failed";
  scores: Record<string, number>;
  roundsWon: Record<string, number>;
  secretReveal?: {
    playerId: string;
    playerName: string;
    nationality: string;
    position: string;
  };
  lastWinner?: {
    participantId: string;
    displayName: string;
    points: number;
    tierLabel: string;
  };
  wrongGuesses: DueloWrongGuessView[];
  pickTimeLimitSeconds: number | null;
  turnStartedAt: string | null;
  turnDeadlineAt: string | null;
};

export type ListaSecretaMpSlotPayload = {
  slotIndex: number;
  secretPlayerId: string;
  hintLabel: string;
  nationality: string;
  position: string;
  showMetaHint: boolean;
  playerName?: string;
  revealedByParticipantId?: string;
};

export type ListaSecretaMpRoundPayload = {
  challengeId: string;
  drawnPlayerIds: string[];
  slots: ListaSecretaMpSlotPayload[];
  playerOrder: [string, string];
  activeParticipantId: string;
  phase: "open" | "completed";
  slotWins: Record<string, number>;
  winnerParticipantId?: string;
  showMetaHint: boolean;
  turnStartedAt?: string;
  wrongGuesses?: DueloWrongGuess[];
};

export type ListaSecretaMpPublicSlot = {
  slotIndex: number;
  hintLabel: string;
  nationality: string;
  position: string;
  showMetaHint: boolean;
  revealed?: {
    playerName: string;
    hintLabel: string;
    nationality: string;
    position: string;
    revealedByParticipantId: string;
    revealedByDisplayName: string;
    ownerColor: "host" | "guest";
  };
};

export type ListaSecretaMpRoundRecap = {
  roundNumber: number;
  title: string;
  challengeId: string;
  winnerParticipantId?: string;
  winnerDisplayName?: string;
  slotWins: Record<string, number>;
  slots: ListaSecretaMpPublicSlot[];
  tied: boolean;
  wrongGuesses: DueloWrongGuessView[];
};

export type ListaSecretaMpStandingEntry = {
  participantId: string;
  displayName: string;
  totalSlots: number;
  roundsWon: number;
  rank: number;
};

export type ListaSecretaMpSessionResult = {
  outcome: "completed";
  standings: ListaSecretaMpStandingEntry[];
  rounds: ListaSecretaMpRoundRecap[];
};

export type ListaSecretaMpViewState = {
  roundNumber: number;
  totalRounds: number;
  title: string;
  description: string;
  searchFilters?: SessionFilters;
  showMetaHint: boolean;
  slots: ListaSecretaMpPublicSlot[];
  activeParticipantId: string;
  activeParticipantName: string;
  isMyTurn: boolean;
  roundStatus: "open" | "completed";
  slotWins: Record<string, number>;
  roundsWon: Record<string, number>;
  playerColors: Record<string, "host" | "guest">;
  lastWinner?: {
    participantId: string;
    displayName: string;
    slotWins: number;
    tied: boolean;
  };
  pickTimeLimitSeconds: number | null;
  turnStartedAt: string | null;
  turnDeadlineAt: string | null;
  wrongGuesses: DueloWrongGuessView[];
};
