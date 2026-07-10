import { POSITIONS, NATIONALITIES } from "@/lib/constants";
import type { CurrentRound, SessionFilters, StandingEntry } from "@/lib/types";

const POSITION_LABELS = Object.fromEntries(
  POSITIONS.map((p) => [p.value, p.label])
);
const NATIONALITY_LABELS = Object.fromEntries(
  NATIONALITIES.map((n) => [n.value, n.label])
);

export function describeSessionFilters(filters: SessionFilters): string[] {
  const parts: string[] = [];

  if (filters.positions?.length) {
    parts.push(
      `Posições: ${filters.positions.map((p) => POSITION_LABELS[p] ?? p).join(", ")}`
    );
  }
  if (filters.nationalities?.length) {
    parts.push(
      `Nacionalidades: ${filters.nationalities.map((n) => NATIONALITY_LABELS[n] ?? n).join(", ")}`
    );
  }
  if (filters.teams?.length) {
    parts.push(`Times: ${filters.teams.join(", ")}`);
  }
  if (filters.eraStart || filters.eraEnd) {
    parts.push(
      `Época: ${filters.eraStart ?? "?"} – ${filters.eraEnd ?? "hoje"}`
    );
  }

  return parts;
}

export function getSessionPhase(session: {
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  currentRound?: CurrentRound | null;
  participants: { status: string }[];
  voteProgress?: { voted: number; total: number };
}): { step: number; label: string; description: string } {
  const count = session.participants.length;
  const confirmed = session.participants.filter(
    (p) => p.status === "confirmed"
  ).length;
  const voted = session.voteProgress?.voted ?? 0;
  const roundLabel = `Round ${session.currentRoundNumber}/${session.totalRounds}`;

  if (session.status === "completed") {
    return {
      step: 5,
      label: "Finalizada",
      description: "Todos os rounds encerrados — veja o ranking final.",
    };
  }

  if (session.status === "setup") {
    if (count < 2) {
      return {
        step: 1,
        label: "Aguardando jogadores",
        description: "Compartilhe o link — precisa de pelo menos 2 participantes.",
      };
    }
    return {
      step: 1,
      label: "Pronta para iniciar",
      description: `${count} participantes. Criador pode iniciar a session.`,
    };
  }

  const roundStatus = session.currentRound?.status;

  if (roundStatus === "voting") {
    return {
      step: 4,
      label: `${roundLabel} · Votação`,
      description: `${voted} de ${count} já votaram. Criador encerra quando todos votarem.`,
    };
  }

  if (roundStatus === "completed") {
    return {
      step: 4,
      label: `${roundLabel} · Encerrado`,
      description:
        session.currentRoundNumber < session.totalRounds
          ? "Round encerrado. Criador pode iniciar o próximo round."
          : "Último round encerrado. Veja o resultado final.",
    };
  }

  if (count < 2) {
    return {
      step: 1,
      label: "Aguardando jogadores",
      description: "Compartilhe o link — precisa de pelo menos 2 participantes.",
    };
  }

  if (confirmed < count) {
    return {
      step: 2,
      label: `${roundLabel} · Montando tops`,
      description: `${confirmed} de ${count} já confirmaram. Tema: ${session.currentRound?.title ?? ""}`,
    };
  }

  return {
    step: 3,
    label: `${roundLabel} · Pronto para votar`,
    description:
      "Todos confirmaram. O criador pode iniciar a votação quando quiser.",
  };
}

export function getAdvanceAction(session: {
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  currentRound?: CurrentRound | null;
  participants: { status: string }[];
  voteProgress?: { voted: number; total: number };
  isCreator: boolean;
}): { canAdvance: boolean; label: string; redirect?: string } | null {
  if (!session.isCreator) return null;

  if (session.status === "setup") {
    return {
      canAdvance: session.participants.length >= 2,
      label: "Iniciar session",
    };
  }

  if (session.status !== "active" || !session.currentRound) return null;

  const round = session.currentRound;

  if (round.status === "open") {
    return {
      canAdvance:
        session.participants.length >= 2 &&
        session.participants.every((p) => p.status === "confirmed"),
      label: "Iniciar votação",
      redirect: "/vote",
    };
  }

  if (round.status === "voting") {
    const allVoted =
      session.voteProgress != null &&
      session.voteProgress.voted >= session.voteProgress.total;
    const isLastRound = session.currentRoundNumber >= session.totalRounds;
    return {
      canAdvance: allVoted,
      label: isLastRound ? "Ver resultado final" : "Encerrar round",
      redirect: isLastRound ? "/results" : "/round-results",
    };
  }

  if (round.status === "completed") {
    if (session.currentRoundNumber < session.totalRounds) {
      return {
        canAdvance: true,
        label: `Iniciar round ${session.currentRoundNumber + 1}`,
      };
    }
    return {
      canAdvance: true,
      label: "Ver resultado final",
      redirect: "/results",
    };
  }

  return null;
}

export function canAdvanceToVoting(session: {
  status: string;
  currentRound?: { status: string } | null;
  participants: { status: string }[];
}): boolean {
  return (
    session.status === "active" &&
    session.currentRound?.status === "open" &&
    session.participants.length >= 2 &&
    session.participants.every((p) => p.status === "confirmed")
  );
}

export function canAdvanceToCompleted(session: {
  status: string;
  currentRound?: { status: string } | null;
  voteProgress?: { voted: number; total: number };
}): boolean {
  return (
    session.status === "active" &&
    session.currentRound?.status === "voting" &&
    session.voteProgress != null &&
    session.voteProgress.voted >= session.voteProgress.total
  );
}

export function canStartSession(session: {
  status: string;
  participants: { status: string }[];
}): boolean {
  return session.status === "setup" && session.participants.length >= 2;
}

export function canStartNextRound(session: {
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  currentRound?: { status: string } | null;
}): boolean {
  return (
    session.status === "active" &&
    session.currentRound?.status === "completed" &&
    session.currentRoundNumber < session.totalRounds
  );
}

export function formatStandingsLabel(standings: StandingEntry[]): string {
  if (standings.length === 0) return "";
  const leader = standings[0];
  return `${leader.displayName} lidera com ${leader.totalPoints} pts`;
}
