import { POSITIONS, NATIONALITIES } from "@/lib/constants";
import { areRoundsValid } from "@/lib/round-config";
import { getPlayers, isSpectator } from "@/lib/participants";
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
  rounds?: { title: string; topN: number }[];
}): { step: number; label: string; description: string } {
  const players = getPlayers(session.participants);
  const count = players.length;
  const confirmed = players.filter((p) => p.status === "confirmed").length;
  const voted = session.voteProgress?.voted ?? 0;
  const roundLabel = `Rodada ${session.currentRoundNumber}/${session.totalRounds}`;

  if (session.status === "completed") {
    return {
      step: 5,
      label: "Finalizada",
      description: "Todas as rodadas encerradas — veja o ranking final.",
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

    const rounds = session.rounds ?? [];
    if (!areRoundsValid(rounds)) {
      return {
        step: 1,
        label: "Configurando rodadas",
        description: session.totalRounds === 0
          ? "O criador está montando as rodadas. Aguarde a configuração."
          : "O criador está finalizando a configuração das rodadas.",
      };
    }

    return {
      step: 1,
      label: "Pronta para iniciar",
      description: `${count} participantes e ${session.totalRounds} rodada(s). Criador pode iniciar a sala.`,
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
          ? "Rodada encerrada. Criador pode iniciar a próxima rodada."
          : "Última rodada encerrada. Veja o resultado final.",
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
      label: `${roundLabel} · Montando rankings`,
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
  rounds?: { title: string; topN: number }[];
}): { canAdvance: boolean; label: string; redirect?: string } | null {
  if (!session.isCreator) return null;

  if (session.status === "setup") {
    const rounds = session.rounds ?? [];
    const roundsReady = areRoundsValid(rounds);
    const players = getPlayers(session.participants);
    return {
      canAdvance: players.length >= 2 && roundsReady,
      label: "Iniciar sala",
    };
  }

  if (session.status !== "active" || !session.currentRound) return null;

  const round = session.currentRound;
  const players = getPlayers(session.participants);

  if (round.status === "open") {
    return {
      canAdvance:
        players.length >= 2 &&
        players.every((p) => p.status === "confirmed"),
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
      label: isLastRound ? "Ver resultado final" : "Encerrar rodada",
      redirect: isLastRound ? "/results" : "/status",
    };
  }

  if (round.status === "completed") {
    if (session.currentRoundNumber < session.totalRounds) {
      return {
        canAdvance: true,
        label: `Iniciar rodada ${session.currentRoundNumber + 1}`,
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
  const players = getPlayers(session.participants);
  return (
    session.status === "active" &&
    session.currentRound?.status === "open" &&
    players.length >= 2 &&
    players.every((p) => p.status === "confirmed")
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
  rounds?: { title: string; topN: number }[];
}): boolean {
  return (
    session.status === "setup" &&
    getPlayers(session.participants).length >= 2 &&
    areRoundsValid(session.rounds ?? [])
  );
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

type ParticipantForRouting = {
  id: string;
  status: string;
  hasVoted?: boolean;
};

type SessionForRouting = {
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  currentRound?: CurrentRound | null;
  participants: ParticipantForRouting[];
  voteProgress?: { voted: number; total: number };
  isCreator?: boolean;
};

export type StatusViewMode = {
  list: "mine" | "winning" | "none";
  showStandings: boolean;
};

export function getStatusViewMode(
  session: SessionForRouting,
  participantId: string | null
): StatusViewMode {
  const roundStatus = session.currentRound?.status;
  const myParticipant = participantId
    ? session.participants.find((p) => p.id === participantId)
    : null;

  if (myParticipant && isSpectator(myParticipant)) {
    if (roundStatus === "completed") {
      return { list: "winning", showStandings: true };
    }
    if (roundStatus === "voting") {
      return { list: "none", showStandings: false };
    }
    return { list: "none", showStandings: true };
  }

  if (roundStatus === "completed") {
    return { list: "winning", showStandings: true };
  }

  if (roundStatus === "voting" && myParticipant?.hasVoted) {
    return { list: "none", showStandings: false };
  }

  if (roundStatus === "open" && myParticipant?.status === "confirmed") {
    return { list: "mine", showStandings: true };
  }

  return { list: "none", showStandings: true };
}

export function getWaitingMessage(
  session: SessionForRouting,
  participantId: string | null
): string {
  const players = getPlayers(session.participants);
  const count = players.length;
  const confirmed = players.filter((p) => p.status === "confirmed").length;
  const voted = session.voteProgress?.voted ?? 0;
  const myParticipant = participantId
    ? session.participants.find((p) => p.id === participantId)
    : null;
  const roundStatus = session.currentRound?.status;

  if (myParticipant && isSpectator(myParticipant)) {
    if (session.status === "completed") {
      return "Modo espectador — veja o resultado final.";
    }
    if (roundStatus === "voting") {
      return "Modo espectador — acompanhe a votação.";
    }
    if (roundStatus === "completed") {
      return "Modo espectador — rodada encerrada, aguardando próxima etapa.";
    }
    return "Modo espectador — acompanhe a partida.";
  }

  if (session.status === "completed") {
    return "Todas as rodadas encerradas — veja o ranking final.";
  }

  if (roundStatus === "completed") {
    if (session.currentRoundNumber < session.totalRounds) {
      return session.isCreator
        ? "Rodada encerrada — lista vitoriosa e classificação reveladas. Inicie a próxima rodada quando estiver pronto."
        : "Rodada encerrada — lista vitoriosa e classificação reveladas. Aguardando o criador iniciar a próxima.";
    }
    return session.isCreator
      ? "Última rodada encerrada — veja a lista vitoriosa e a classificação. Avance para o resultado final."
      : "Última rodada encerrada — veja a lista vitoriosa e a classificação. Aguardando o criador.";
  }

  if (roundStatus === "voting") {
    if (myParticipant?.hasVoted) {
      if (voted < count) {
        return `Você votou! Aguardando os outros (${voted}/${count}). A classificação será revelada ao encerrar a rodada.`;
      }
      return "Todos votaram! Aguardando o criador encerrar a rodada e revelar a classificação.";
    }
    if (voted < count) {
      return `Aguardando os outros votarem (${voted}/${count})`;
    }
    return "Todos votaram! Aguardando o criador encerrar a rodada.";
  }

  if (roundStatus === "open") {
    if (myParticipant?.status === "confirmed" && confirmed < count) {
      return `Aguardando os outros montarem o ranking (${confirmed}/${count} confirmados)`;
    }
    if (confirmed >= count) {
      return "Todos confirmaram! Aguardando o criador iniciar a votação.";
    }
  }

  return "Aguardando a próxima etapa.";
}

export function getParticipantRoute(
  session: SessionForRouting,
  participantId: string | null
): string {
  const myParticipant = participantId
    ? session.participants.find((p) => p.id === participantId)
    : null;

  if (myParticipant && isSpectator(myParticipant)) {
    if (session.status === "completed") {
      return "/results";
    }
    if (session.currentRound?.status === "voting") {
      return "/vote";
    }
    return "/status";
  }

  if (session.status === "completed") {
    return "/results";
  }

  if (session.status === "setup") {
    return "";
  }

  const roundStatus = session.currentRound?.status;

  if (roundStatus === "open") {
    if (!myParticipant || myParticipant.status !== "confirmed") {
      return "/pick";
    }
    return "/status";
  }

  if (roundStatus === "voting") {
    if (!myParticipant?.hasVoted) {
      return "/vote";
    }
    return "/status";
  }

  if (roundStatus === "completed") {
    return "/status";
  }

  return "/status";
}

export function buildParticipantPath(
  code: string,
  session: SessionForRouting,
  participantId: string | null
): string {
  const route = getParticipantRoute(session, participantId);
  if (route === "") return `/s/${code}`;
  return `/s/${code}${route}`;
}
