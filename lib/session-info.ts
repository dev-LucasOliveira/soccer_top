import { POSITIONS, NATIONALITIES } from "@/lib/constants";
import { areRoundsValid } from "@/lib/round-config";
import { getPlayers, isSpectator } from "@/lib/participants";
import { MIN_IMPOSTOR_PLAYERS } from "@/lib/impostor-constants";
import { MIN_DUELO_PLAYERS } from "@/lib/duelo-constants";
import { MIN_LSMP_PLAYERS } from "@/lib/lista-secreta-mp-constants";
import type { CurrentRound, DueloViewState, GameMode, ListaSecretaMpViewState, SessionFilters, StandingEntry } from "@/lib/types";

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
  gameMode?: GameMode;
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  currentRound?: CurrentRound | null;
  participants: { status: string }[];
  voteProgress?: { voted: number; total: number };
  rounds?: { title: string; topN: number }[];
  impostorThemeSelected?: boolean;
  umSoTotalRounds?: number | null;
  listaSecretaTotalRounds?: number | null;
  listaSecretaSlotCount?: number | null;
}): { step: number; label: string; description: string } {
  if (session.gameMode === "lobby") {
    const count = getPlayers(session.participants).length;
    if (session.status === "completed") {
      return {
        step: 1,
        label: "Lobby",
        description: "Partida encerrada — o criador pode escolher outro modo.",
      };
    }
    return {
      step: 1,
      label: "Escolha o modo",
      description:
        count < 2
          ? "Compartilhe o link. Quando entrarem, o criador escolhe o modo de jogo."
          : `${count} jogadores na sala. O criador escolhe o modo de jogo.`,
    };
  }

  if (session.gameMode === "lista-secreta-mp") {
    return getListaSecretaMpSessionPhase(session);
  }

  if (session.gameMode === "duelo") {
    return getDueloSessionPhase(session);
  }

  if (session.gameMode === "impostor") {
    return getImpostorSessionPhase(session);
  }

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

function getImpostorSessionPhase(session: {
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  currentRound?: CurrentRound | null;
  participants: { status: string }[];
  voteProgress?: { voted: number; total: number };
  impostorThemeSelected?: boolean;
}): { step: number; label: string; description: string } {
  const players = getPlayers(session.participants);
  const count = players.length;
  const confirmed = players.filter((p) => p.status === "confirmed").length;
  const voted = session.voteProgress?.voted ?? 0;
  const roundLabel = `Rodada ${session.currentRoundNumber}/${session.totalRounds || 3}`;

  if (session.status === "completed") {
    return {
      step: 5,
      label: "Finalizada",
      description: "O jogo terminou — veja quem era o impostor.",
    };
  }

  if (session.status === "setup") {
    if (count < MIN_IMPOSTOR_PLAYERS) {
      return {
        step: 1,
        label: "Aguardando jogadores",
        description: `Compartilhe o link — precisa de pelo menos ${MIN_IMPOSTOR_PLAYERS} participantes.`,
      };
    }

    return {
      step: 1,
      label: "Pronta para iniciar",
      description: `${count} participantes no jogo. O tema será sorteado ao iniciar — criador pode começar a partida.`,
    };
  }

  const roundStatus = session.currentRound?.status;

  if (roundStatus === "open") {
    return {
      step: 2,
      label: `${roundLabel} · Escolhendo carta`,
      description: `${confirmed} de ${count} já escolheram a carta.`,
    };
  }

  if (roundStatus === "reveal") {
    return {
      step: 3,
      label: `${roundLabel} · Debate`,
      description: "Discutam as listas. O criador abre a votação quando quiser.",
    };
  }

  if (roundStatus === "voting") {
    return {
      step: 4,
      label: `${roundLabel} · Votação`,
      description: `${voted} de ${count} já votaram para eliminar alguém.`,
    };
  }

  if (roundStatus === "completed") {
    return {
      step: 4,
      label: `${roundLabel} · Encerrada`,
      description: "Rodada encerrada. Aguardando próxima etapa.",
    };
  }

  return {
    step: 2,
    label: "Em andamento",
    description: "Aguardando a próxima etapa.",
  };
}

export function getAdvanceAction(session: {
  gameMode?: GameMode;
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  currentRound?: CurrentRound | null;
  participants: { status: string }[];
  voteProgress?: { voted: number; total: number };
  isCreator?: boolean;
  rounds?: { title: string; topN: number }[];
  impostorThemeSelected?: boolean;
  umSoTotalRounds?: number | null;
  listaSecretaTotalRounds?: number | null;
  listaSecretaSlotCount?: number | null;
}): { canAdvance: boolean; label: string; redirect?: string } | null {
  if (session.gameMode === "lobby") {
    return null;
  }

  if (session.gameMode === "lista-secreta-mp") {
    return getListaSecretaMpAdvanceAction(session);
  }

  if (session.gameMode === "duelo") {
    return getDueloAdvanceAction(session);
  }

  if (session.gameMode === "impostor") {
    return getImpostorAdvanceAction(session);
  }

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

function getImpostorAdvanceAction(session: {
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  currentRound?: CurrentRound | null;
  participants: { status: string }[];
  voteProgress?: { voted: number; total: number };
  isCreator?: boolean;
  impostorThemeSelected?: boolean;
}): { canAdvance: boolean; label: string; redirect?: string } | null {
  if (!session.isCreator) return null;

  if (session.status === "setup") {
    const players = getPlayers(session.participants);
    return {
      canAdvance: players.length >= MIN_IMPOSTOR_PLAYERS,
      label: "Iniciar jogo",
    };
  }

  if (session.status !== "active" || !session.currentRound) return null;

  const round = session.currentRound;
  const players = getPlayers(session.participants);

  if (round.status === "open") {
    return {
      canAdvance:
        players.length >= MIN_IMPOSTOR_PLAYERS &&
        players.every((p) => p.status === "confirmed"),
      label: "Iniciar debate",
      redirect: "/reveal",
    };
  }

  if (round.status === "reveal") {
    return {
      canAdvance: true,
      label: "Abrir votação",
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
  gameMode?: GameMode;
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  currentRound?: CurrentRound | null;
  participants: ParticipantForRouting[];
  voteProgress?: { voted: number; total: number };
  isCreator?: boolean;
  umSoTotalRounds?: number | null;
  dueloView?: DueloViewState | null;
  listaSecretaTotalRounds?: number | null;
  listaSecretaSlotCount?: number | null;
  listaSecretaMpView?: ListaSecretaMpViewState | null;
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

  if (session.gameMode === "lista-secreta-mp") {
    if (session.status === "completed") {
      return "Partida encerrada — veja o placar final.";
    }

    if (session.status === "setup") {
      const lsmpPlayers = getPlayers(session.participants);
      if (lsmpPlayers.length < MIN_LSMP_PLAYERS) {
        return "Aguardando oponente — Lista Secreta 1v1 precisa de exatamente 2 jogadores.";
      }
      if (!session.listaSecretaTotalRounds || !session.listaSecretaSlotCount) {
        return session.isCreator
          ? "Defina rodadas e jogadores secretos por rodada."
          : "Aguardando o criador configurar a partida.";
      }
      return session.isCreator
        ? "Pronto para iniciar — clique em Iniciar partida."
        : "Aguardando o criador iniciar.";
    }

    const lsmpView = session.listaSecretaMpView;
    if (lsmpView?.isMyTurn) {
      return "Sua vez — descubra os jogadores da lista secreta!";
    }
    if (lsmpView?.roundStatus === "open") {
      return `Aguardando ${lsmpView.activeParticipantName}…`;
    }
    if (lsmpView?.roundStatus === "completed" && lsmpView.lastWinner) {
      if (lsmpView.lastWinner.tied) {
        return "Rodada empatada! Próxima rodada em instantes…";
      }
      return `${lsmpView.lastWinner.displayName} venceu a rodada! Próxima em instantes…`;
    }

    return "Partida em andamento.";
  }

  if (session.gameMode === "duelo") {
    if (session.status === "completed") {
      return "Duelo encerrado — veja o placar final.";
    }

    if (session.status === "setup") {
      const dueloPlayers = getPlayers(session.participants);
      if (dueloPlayers.length < MIN_DUELO_PLAYERS) {
        return "Aguardando oponente — o duelo precisa de exatamente 2 jogadores.";
      }
      if (!session.umSoTotalRounds) {
        return session.isCreator
          ? "Defina quantas rodadas valerão no duelo."
          : "Aguardando o criador configurar as rodadas.";
      }
      return session.isCreator
        ? "Pronto para iniciar — clique em Iniciar duelo."
        : "Aguardando o criador iniciar o duelo.";
    }

    const dueloView = session.dueloView;
    if (dueloView?.isMyTurn) {
      return "Sua vez — chute o jogador secreto!";
    }
    if (dueloView?.roundStatus === "open") {
      return `Aguardando ${dueloView.activeParticipantName}…`;
    }
    if (dueloView?.roundStatus === "completed" && dueloView.lastWinner) {
      return `${dueloView.lastWinner.displayName} acertou! Próxima rodada em instantes…`;
    }
    if (dueloView?.roundStatus === "failed") {
      return "Ninguém acertou — duelo encerrado.";
    }

    return "Duelo em andamento.";
  }

  if (session.gameMode === "impostor") {
    if (myParticipant && isSpectator(myParticipant)) {
      if (session.status === "completed") return "Modo espectador — veja o resultado final.";
      if (roundStatus === "voting") return "Modo espectador — acompanhe a votação.";
      if (roundStatus === "reveal") return "Modo espectador — acompanhe o debate.";
      return "Modo espectador — você foi eliminado.";
    }

    if (session.status === "completed") {
      return "Jogo encerrado — veja quem era o impostor.";
    }

    if (roundStatus === "open") {
      if (myParticipant?.status !== "confirmed") {
        return "Escolha uma carta para completar sua lista.";
      }
      if (confirmed < count) {
        return `Aguardando os outros escolherem (${confirmed}/${count}).`;
      }
      return "Todos escolheram! Aguardando o criador iniciar o debate.";
    }

    if (roundStatus === "reveal") {
      return session.isCreator
        ? "Debatam as listas e abram a votação quando estiverem prontos."
        : "Debatam as listas. Aguardando o criador abrir a votação.";
    }

    if (roundStatus === "voting") {
      if (myParticipant?.hasVoted) {
        return voted < count
          ? `Você votou! Aguardando os outros (${voted}/${count}).`
          : "Todos votaram! Aguardando o criador encerrar a rodada.";
      }
      return "Vote em quem você acha que é o impostor.";
    }

    return "Aguardando a próxima etapa.";
  }

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
  if (session.gameMode === "lista-secreta-mp") {
    return getListaSecretaMpParticipantRoute(session);
  }

  if (session.gameMode === "duelo") {
    return getDueloParticipantRoute(session);
  }

  if (session.gameMode === "impostor") {
    return getImpostorParticipantRoute(session, participantId);
  }

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

function getDueloSessionPhase(session: {
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  participants: { status: string }[];
  umSoTotalRounds?: number | null;
}): { step: number; label: string; description: string } {
  const players = getPlayers(session.participants);
  const configuredRounds = session.umSoTotalRounds ?? 0;

  if (session.status === "completed") {
    return {
      step: 4,
      label: "Finalizado",
      description: "Duelo encerrado — veja o placar final.",
    };
  }

  if (session.status === "setup") {
    if (players.length < MIN_DUELO_PLAYERS) {
      return {
        step: 1,
        label: "Aguardando oponente",
        description: "Compartilhe o link — o duelo precisa de exatamente 2 jogadores.",
      };
    }

    if (!configuredRounds) {
      return {
        step: 2,
        label: "Configurar rodadas",
        description: "O criador define quantas rodadas valerão no duelo.",
      };
    }

    return {
      step: 2,
      label: "Pronto para iniciar",
      description: `${configuredRounds} rodada(s) configuradas. O criador pode iniciar.`,
    };
  }

  return {
    step: 3,
    label: `Rodada ${session.currentRoundNumber}/${session.totalRounds}`,
    description: "Duelo em andamento — turnos alternados com dicas compartilhadas.",
  };
}

function getDueloAdvanceAction(session: {
  status: string;
  participants: { status: string }[];
  isCreator?: boolean;
  umSoTotalRounds?: number | null;
}): { canAdvance: boolean; label: string; redirect?: string } | null {
  if (!session.isCreator) return null;

  if (session.status === "setup") {
    const players = getPlayers(session.participants);
    return {
      canAdvance:
        players.length === MIN_DUELO_PLAYERS &&
        Boolean(session.umSoTotalRounds && session.umSoTotalRounds > 0),
      label: "Iniciar duelo",
      redirect: "/duelo",
    };
  }

  if (session.status === "completed") {
    return {
      canAdvance: true,
      label: "Ver resultado",
      redirect: "/results",
    };
  }

  return null;
}

function getDueloParticipantRoute(session: SessionForRouting): string {
  if (session.status === "completed") {
    return "/results";
  }

  if (session.status === "setup") {
    return "";
  }

  return "/duelo";
}

function getListaSecretaMpSessionPhase(session: {
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  participants: { status: string }[];
  listaSecretaTotalRounds?: number | null;
  listaSecretaSlotCount?: number | null;
}): { step: number; label: string; description: string } {
  const players = getPlayers(session.participants);
  const configuredRounds = session.listaSecretaTotalRounds ?? 0;
  const slotCount = session.listaSecretaSlotCount ?? 0;

  if (session.status === "completed") {
    return {
      step: 4,
      label: "Finalizado",
      description: "Partida encerrada — veja quem descobriu mais jogadores.",
    };
  }

  if (session.status === "setup") {
    if (players.length < MIN_LSMP_PLAYERS) {
      return {
        step: 1,
        label: "Aguardando oponente",
        description: "Compartilhe o link — precisa de exatamente 2 jogadores.",
      };
    }

    if (!configuredRounds || !slotCount) {
      return {
        step: 2,
        label: "Configurar partida",
        description: "O criador define rodadas e quantos jogadores secretos por lista.",
      };
    }

    return {
      step: 2,
      label: "Pronto para iniciar",
      description: `${configuredRounds} rodada(s), ${slotCount} jogadores secretos por lista.`,
    };
  }

  return {
    step: 3,
    label: `Rodada ${session.currentRoundNumber}/${session.totalRounds}`,
    description: "Turnos alternados — quem acertar pinta o slot com sua cor.",
  };
}

function getListaSecretaMpAdvanceAction(session: {
  status: string;
  participants: { status: string }[];
  isCreator?: boolean;
  listaSecretaTotalRounds?: number | null;
  listaSecretaSlotCount?: number | null;
}): { canAdvance: boolean; label: string; redirect?: string } | null {
  if (!session.isCreator) return null;

  if (session.status === "setup") {
    const players = getPlayers(session.participants);
    return {
      canAdvance:
        players.length === MIN_LSMP_PLAYERS &&
        Boolean(session.listaSecretaTotalRounds && session.listaSecretaTotalRounds > 0) &&
        Boolean(session.listaSecretaSlotCount && session.listaSecretaSlotCount > 0),
      label: "Iniciar partida",
      redirect: "/lista-secreta",
    };
  }

  if (session.status === "completed") {
    return {
      canAdvance: true,
      label: "Ver resultado",
      redirect: "/results",
    };
  }

  return null;
}

function getListaSecretaMpParticipantRoute(session: SessionForRouting): string {
  if (session.status === "completed") {
    return "/results";
  }

  if (session.status === "setup") {
    return "";
  }

  return "/lista-secreta";
}

function getImpostorParticipantRoute(
  session: SessionForRouting,
  participantId: string | null
): string {
  const myParticipant = participantId
    ? session.participants.find((p) => p.id === participantId)
    : null;

  if (session.status === "completed") {
    return "/results";
  }

  if (session.status === "setup") {
    return "";
  }

  const roundStatus = session.currentRound?.status;

  if (roundStatus === "open") {
    if (myParticipant && isSpectator(myParticipant)) {
      return "/status";
    }
    if (!myParticipant || myParticipant.status !== "confirmed") {
      return "/pick";
    }
    return "/status";
  }

  if (roundStatus === "reveal") {
    return "/reveal";
  }

  if (roundStatus === "voting") {
    if (myParticipant && isSpectator(myParticipant)) {
      return "/vote";
    }
    if (!myParticipant?.hasVoted) {
      return "/vote";
    }
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
