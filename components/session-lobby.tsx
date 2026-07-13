"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { copyToClipboard } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SessionHeader } from "@/components/session-header";
import { StandingsTable } from "@/components/standings-table";
import { RoundSetupPanel } from "@/components/round-setup-panel";
import { ImpostorThemePicker } from "@/components/impostor-theme-picker";
import { DueloLobbyConfig } from "@/components/duelo-lobby-config";
import { ListaSecretaMpLobbyConfig } from "@/components/lista-secreta-mp-lobby-config";
import { LobbyModeSelector } from "@/components/lobby-mode-selector";
import { MIN_IMPOSTOR_PLAYERS } from "@/lib/impostor-constants";
import { MIN_DUELO_PLAYERS } from "@/lib/duelo-constants";
import { MIN_LSMP_PLAYERS } from "@/lib/lista-secreta-mp-constants";
import { formatPickTimeLimit } from "@/lib/pick-time-limit";
import { getGuestToken } from "@/lib/guest";
import { Copy, Check, Users, Share2, ListOrdered, UserMinus } from "lucide-react";
import { describeSessionFilters } from "@/lib/session-info";
import { getPlayers } from "@/lib/participants";
import {
  handleRemovedFromSession,
  isRemovedFromSessionResponse,
} from "@/lib/session-membership";
import type {
  CurrentRound,
  RoundSummary,
  SessionFinalResult,
  SessionFilters,
  StandingEntry,
  GameMode,
  DueloViewState,
  ListaSecretaMpViewState,
} from "@/lib/types";

type Participant = {
  id: string;
  displayName: string;
  status: string;
  pickCount: number;
  hasVoted?: boolean;
};

type SessionData = {
  code: string;
  title: string;
  gameMode: GameMode;
  topN: number;
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
  impostorThemeId: string | null;
  impostorThemeSelected?: boolean;
  umSoTotalRounds?: number | null;
  listaSecretaTotalRounds?: number | null;
  listaSecretaSlotCount?: number | null;
  pickTimeLimitSeconds?: number | null;
  dueloView?: DueloViewState | null;
  listaSecretaMpView?: ListaSecretaMpViewState | null;
  filters: SessionFilters;
  createdAt: string;
  creatorParticipantId: string | null;
  isCreator: boolean;
  voteProgress: { voted: number; total: number };
  participants: Participant[];
  rounds: RoundSummary[];
  currentRound: CurrentRound | null;
  standings: StandingEntry[];
  result: SessionFinalResult | null;
  phase: { step: number; label: string; description: string };
  advanceAction: {
    canAdvance: boolean;
    label: string;
    redirect?: string;
  } | null;
};

const STEPS = [
  { num: 1, label: "Entrar" },
  { num: 2, label: "Montar" },
  { num: 3, label: "Confirmar" },
  { num: 4, label: "Votar" },
  { num: 5, label: "Resultado" },
];

const IMPOSTOR_STEPS = [
  { num: 1, label: "Entrar" },
  { num: 2, label: "Cartas" },
  { num: 3, label: "Debate" },
  { num: 4, label: "Votar" },
  { num: 5, label: "Resultado" },
];

const DUELO_STEPS = [
  { num: 1, label: "Entrar" },
  { num: 2, label: "Configurar" },
  { num: 3, label: "Jogar" },
  { num: 4, label: "Resultado" },
];

const LOBBY_STEPS = [
  { num: 1, label: "Entrar" },
  { num: 2, label: "Modo" },
  { num: 3, label: "Configurar" },
  { num: 4, label: "Jogar" },
];

export function SessionLobby({
  code,
  participantId,
}: {
  code: string;
  participantId: string | null;
}) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState("");
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState("");
  const [returningToLobby, setReturningToLobby] = useState(false);
  const [returnToLobbyError, setReturnToLobbyError] = useState("");
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(
    null
  );
  const [removeParticipantError, setRemoveParticipantError] = useState("");

  const fetchSession = async () => {
    try {
      const params = participantId
        ? `?participantId=${participantId}`
        : "";
      const res = await fetch(`/api/sessions/${code}${params}`);
      const data = await res.json();
      if (isRemovedFromSessionResponse(res, data)) {
        handleRemovedFromSession(code, router);
        return;
      }
      if (res.ok) {
        setSession(data);
        if (data.status === "completed") {
          router.prefetch(`/s/${code}/results`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, [code, participantId]);

  const [shareUrl, setShareUrl] = useState(`/s/${code}`);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/s/${code}`);
  }, [code]);

  async function copyLink() {
    const urlToCopy =
      shareUrl.startsWith("http") ? shareUrl : `${window.location.origin}${shareUrl}`;
    const ok = await copyToClipboard(urlToCopy);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAdvance() {
    if (!participantId || !session?.advanceAction) return;
    setAdvancing(true);
    setAdvanceError("");

    try {
      const res = await fetch(`/api/sessions/${code}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const sessionRes = await fetch(
        `/api/sessions/${code}?participantId=${participantId}`
      );
      const sessionData = await sessionRes.json();
      if (sessionRes.ok) {
        setSession(sessionData);
        const redirect = session.advanceAction?.redirect;
        if (redirect) {
          router.push(`/s/${code}${redirect}`);
        }
      }
    } catch (err) {
      setAdvanceError(
        err instanceof Error ? err.message : "Erro ao avançar fase"
      );
    } finally {
      setAdvancing(false);
    }
  }

  async function handleReturnToLobby() {
    if (!participantId) return;
    setReturningToLobby(true);
    setReturnToLobbyError("");

    try {
      const res = await fetch(`/api/sessions/${code}/return-to-lobby`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchSession();
      router.refresh();
    } catch (err) {
      setReturnToLobbyError(
        err instanceof Error ? err.message : "Erro ao voltar ao lobby"
      );
    } finally {
      setReturningToLobby(false);
    }
  }

  async function handleRemoveParticipant(
    targetParticipantId: string,
    displayName: string
  ) {
    if (!participantId || !session?.isCreator) return;
    if (
      !window.confirm(`Remover ${displayName} da sala? Essa pessoa precisará entrar de novo.`)
    ) {
      return;
    }

    setRemovingParticipantId(targetParticipantId);
    setRemoveParticipantError("");

    try {
      const res = await fetch(`/api/sessions/${code}/remove-participant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
          targetParticipantId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchSession();
    } catch (err) {
      setRemoveParticipantError(
        err instanceof Error ? err.message : "Erro ao remover participante"
      );
    } finally {
      setRemovingParticipantId(null);
    }
  }

  async function handleRestart() {
    if (!participantId) return;
    setRestarting(true);
    setRestartError("");

    try {
      const res = await fetch(`/api/sessions/${code}/restart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          guestToken: getGuestToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchSession();
      router.refresh();
    } catch (err) {
      setRestartError(
        err instanceof Error ? err.message : "Erro ao reiniciar sessão"
      );
    } finally {
      setRestarting(false);
    }
  }

  if (loading) {
    return (
      <p className="loading-pulse text-center text-on-pitch-muted">Carregando sala...</p>
    );
  }

  if (!session) {
    return <p className="text-center text-red-300">Sala não encontrada</p>;
  }

  const myParticipant = session.participants.find((p) => p.id === participantId);
  const phase = session.phase;
  const filterDescriptions = describeSessionFilters(session.filters);
  const players = getPlayers(session.participants);
  const confirmedCount = players.filter((p) => p.status === "confirmed").length;
  const roundStatus = session.currentRound?.status;
  const advanceAction = session.advanceAction;
  const isImpostor = session.gameMode === "impostor";
  const isDuelo = session.gameMode === "duelo";
  const isLsmp = session.gameMode === "lista-secreta-mp";
  const isLobby = session.gameMode === "lobby";
  const stepItems = isLobby
    ? LOBBY_STEPS
    : isImpostor
      ? IMPOSTOR_STEPS
      : isDuelo || isLsmp
        ? DUELO_STEPS
        : STEPS;
  const minPlayers = isLobby
    ? 2
    : isImpostor
      ? MIN_IMPOSTOR_PLAYERS
      : isDuelo
        ? MIN_DUELO_PLAYERS
        : isLsmp
          ? MIN_LSMP_PLAYERS
          : 2;

  function participantBadge(p: Participant) {
    if (p.status === "spectator") return isImpostor ? "Eliminado" : "Espectador";
    if (roundStatus === "voting") {
      return p.hasVoted ? "Votou" : "Aguardando voto";
    }
    if (roundStatus === "reveal") return "No debate";
    if (p.status === "confirmed") return isImpostor ? "Escolheu" : "Confirmado";
    return isImpostor
      ? "Escolhendo carta"
      : `Montando ${p.pickCount}/${session!.topN}`;
  }

  function participantBadgeVariant(p: Participant) {
    if (p.status === "spectator") return "default";
    if (roundStatus === "voting") {
      return p.hasVoted ? "success" : "warning";
    }
    return p.status === "confirmed" ? "success" : "warning";
  }

  const isSpectator = myParticipant?.status === "spectator";

  const showPickActions =
    session.status === "active" && roundStatus === "open" && !isSpectator;
  const showRevealActions =
    session.status === "active" && roundStatus === "reveal";
  const showVoteActions =
    session.status === "active" && roundStatus === "voting" && !isSpectator;

  return (
    <div className="space-y-5">
      <SessionHeader
        title={session.title}
        code={code}
        stepLabel={phase.label}
        backHref="/"
        backLabel="← Voltar"
      />

      {session.gameMode !== "lobby" &&
        session.gameMode !== "impostor" &&
        session.gameMode !== "duelo" &&
        session.gameMode !== "lista-secreta-mp" &&
        session.standings.length > 0 && (
        <StandingsTable standings={session.standings} />
      )}

      <Card>
        <div className="mb-3 flex items-center gap-2 text-foreground">
          <ListOrdered size={18} className="text-pitch" />
          <h2 className="font-display text-lg text-foreground">Como funciona esta sala</h2>
        </div>
        <p className="mb-4 text-sm text-text-muted">{phase.description}</p>
        <div
          className={`-mx-5 flex gap-2 overflow-x-auto scroll-smooth px-5 pb-1 sm:mx-0 sm:grid ${
            isLobby || isDuelo || isLsmp ? "sm:grid-cols-4" : "sm:grid-cols-5"
          } sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0`}
        >
          {stepItems.map((s) => (
            <div
              key={s.num}
              className={`min-w-[4.75rem] shrink-0 rounded-lg border p-2 text-center text-xs leading-tight transition-colors duration-200 sm:min-w-0 sm:shrink ${
                phase.step >= s.num
                  ? "border-pitch/20 bg-surface-elevated font-medium text-foreground shadow-sm"
                  : "border-card-border bg-surface-elevated text-foreground/70"
              }`}
            >
              <div
                className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  phase.step >= s.num
                    ? "rank-badge-card"
                    : "border border-card-border bg-off-white-surface text-foreground/70"
                }`}
              >
                {s.num}
              </div>
              <p>{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {session.status === "setup" && participantId ? (
        isLobby ? (
          session.isCreator ? (
            <LobbyModeSelector
              code={code}
              participantId={participantId}
              playerCount={players.length}
              onModeSelected={fetchSession}
            />
          ) : (
            <Card className="p-4 text-sm text-text-muted">
              Aguardando o criador escolher o modo de jogo.
            </Card>
          )
        ) : isImpostor ? (
          session.isCreator ? (
            <Card>
              <h2 className="mb-4 font-display text-lg text-foreground">
                Tema da partida
              </h2>
              <ImpostorThemePicker
                code={code}
                participantId={participantId}
                selectedThemeId={session.impostorThemeId}
                onThemeSelected={fetchSession}
              />
            </Card>
          ) : (
            <Card className="p-4 text-sm text-text-muted">
              Aguardando o criador escolher o tema da partida.
            </Card>
          )
        ) : isDuelo ? (
          session.isCreator ? (
            <Card>
              <h2 className="mb-4 font-display text-lg text-foreground">
                Configurar duelo
              </h2>
              <DueloLobbyConfig
                code={code}
                participantId={participantId}
                initialRounds={session.umSoTotalRounds ?? null}
                initialPickTimeLimitSeconds={session.pickTimeLimitSeconds ?? null}
                onSaved={fetchSession}
              />
            </Card>
          ) : (
            <Card className="p-4 text-sm text-text-muted">
              {session.umSoTotalRounds
                ? `${session.umSoTotalRounds} rodada(s), ${formatPickTimeLimit(session.pickTimeLimitSeconds)}. Aguardando o criador iniciar.`
                : "Aguardando o criador configurar as rodadas do duelo."}
            </Card>
          )
        ) : isLsmp ? (
          session.isCreator ? (
            <Card>
              <h2 className="mb-4 font-display text-lg text-foreground">
                Configurar Lista Secreta 1v1
              </h2>
              <ListaSecretaMpLobbyConfig
                code={code}
                participantId={participantId}
                initialRounds={session.listaSecretaTotalRounds ?? null}
                initialSlotCount={session.listaSecretaSlotCount ?? null}
                initialPickTimeLimitSeconds={session.pickTimeLimitSeconds ?? null}
                onSaved={fetchSession}
              />
            </Card>
          ) : (
            <Card className="p-4 text-sm text-text-muted">
              {session.listaSecretaTotalRounds && session.listaSecretaSlotCount
                ? `${session.listaSecretaTotalRounds} rodada(s), ${session.listaSecretaSlotCount} jogadores secretos, ${formatPickTimeLimit(session.pickTimeLimitSeconds)}. Aguardando o criador iniciar.`
                : "Aguardando o criador configurar rodadas e jogadores secretos."}
            </Card>
          )
        ) : (
          <RoundSetupPanel
            code={code}
            participantId={participantId}
            rounds={session.rounds}
            isCreator={session.isCreator}
            onRefresh={fetchSession}
          />
        )
      ) : session.totalRounds > 0 ? (
        <Card>
          <h2 className="mb-2 font-bold text-foreground">
            Rodadas ({session.totalRounds})
          </h2>
          <div className="space-y-2">
            {session.rounds.map((round) => (
              <div
                key={round.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                  round.number === session.currentRoundNumber
                    ? "bg-gold/15 ring-1 ring-gold"
                    : "bg-off-white-muted"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Rodada {round.number}: {round.title}
                  </p>
                  <p className="text-xs text-text-muted">
                    {isDuelo
                      ? "Duelo 1v1"
                      : isLsmp
                        ? "Lista Secreta 1v1"
                        : `Top de ${round.topN}`}
                  </p>
                </div>
                <Badge
                  variant={
                    round.status === "completed"
                      ? "success"
                      : round.number === session.currentRoundNumber
                        ? "gold"
                        : "warning"
                  }
                >
                  {round.status === "pending"
                    ? "Pendente"
                    : round.status === "open"
                      ? isImpostor
                        ? "Cartas"
                        : isDuelo || isLsmp
                          ? "Em jogo"
                          : "Montando"
                      : round.status === "reveal"
                        ? "Debate"
                        : round.status === "voting"
                          ? "Votando"
                          : round.status === "failed"
                            ? "Sem acerto"
                            : "Encerrado"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {session.currentRound && session.status === "active" && !isImpostor && !isDuelo && !isLsmp && (
        <Card>
          <h2 className="mb-2 font-bold text-foreground">
            Rodada atual — {session.currentRound.title}
          </h2>
          <div className="space-y-1 text-sm text-text-muted">
            <p>
              Top de <strong className="text-foreground">{session.topN}</strong>{" "}
              jogadores por participante
            </p>
            {filterDescriptions.length > 0 ? (
              filterDescriptions.map((f) => <p key={f}>· {f}</p>)
            ) : (
              <p>· Sem filtros — todos os jogadores do catálogo</p>
            )}
          </div>
        </Card>
      )}

      {isDuelo && session.status === "active" && session.dueloView && (
        <Card>
          <h2 className="mb-2 font-bold text-foreground">
            Placar do duelo
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {session.participants.map((p) => (
              <div
                key={p.id}
                className="rounded-xl bg-off-white-muted px-3 py-3 text-center"
              >
                <p className="text-sm font-medium text-foreground">
                  {p.displayName}
                </p>
                <p className="font-display text-xl text-gold-dark">
                  {session.dueloView?.scores[p.id] ?? 0} pts
                </p>
                <p className="text-xs text-text-muted">
                  {session.dueloView?.roundsWon[p.id] ?? 0} rodada(s)
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isLsmp && session.status === "active" && session.listaSecretaMpView && (
        <Card>
          <h2 className="mb-2 font-bold text-foreground">
            Placar da partida
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {session.participants.map((p) => (
              <div
                key={p.id}
                className="rounded-xl bg-off-white-muted px-3 py-3 text-center"
              >
                <p className="text-sm font-medium text-foreground">
                  {p.displayName}
                </p>
                <p className="font-display text-xl text-gold-dark">
                  {session.listaSecretaMpView?.roundsWon[p.id] ?? 0} rodada(s)
                </p>
                <p className="text-xs text-text-muted">
                  {session.listaSecretaMpView?.slotWins[p.id] ?? 0} slot(s) na rodada
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <Share2 size={18} className="text-pitch" />
            <p className="font-bold">Compartilhar</p>
          </div>
          <Button variant="secondary" size="sm" onClick={copyLink} className="self-start sm:self-auto">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copiado!" : "Copiar link"}
          </Button>
        </div>
        <p className="mt-2 break-all rounded-lg border border-card-border bg-off-white-muted px-3 py-2 font-mono text-xs tracking-wide text-foreground sm:truncate">
          /s/{code}
        </p>
      </Card>

      <Card>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <Users size={18} className="text-pitch" />
            <h2 className="font-bold">
              Participantes ({session.participants.length})
            </h2>
          </div>
          {roundStatus === "voting" ? (
            <Badge variant={session.voteProgress.voted >= session.voteProgress.total ? "success" : "warning"} className="self-start sm:self-auto">
              {session.voteProgress.voted}/{session.voteProgress.total} votaram
            </Badge>
          ) : showPickActions ? (
            <Badge
              variant={
                confirmedCount === players.length && players.length >= 2
                  ? "success"
                  : "warning"
              }
              className="self-start sm:self-auto"
            >
              {confirmedCount}/{players.length} confirmados
            </Badge>
          ) : null}
        </div>
        <div className="space-y-2">
          {session.participants.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-2 rounded-xl bg-off-white-muted px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0 font-medium text-foreground">
                {p.displayName}
                {p.id === participantId && (
                  <span className="ml-2 text-xs text-pitch">(você)</span>
                )}
                {p.id === session.creatorParticipantId && (
                  <span className="ml-2 text-xs text-gold-dark">criador</span>
                )}
              </span>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge variant={participantBadgeVariant(p)}>
                  {participantBadge(p)}
                </Badge>
                {session.isCreator && p.id !== participantId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={removingParticipantId === p.id}
                    onClick={() => handleRemoveParticipant(p.id, p.displayName)}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <UserMinus size={14} aria-hidden />
                    {removingParticipantId === p.id ? "Removendo..." : "Remover"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        {removeParticipantError && (
          <p className="mt-3 text-center text-sm text-red-400">
            {removeParticipantError}
          </p>
        )}
        {session.participants.length < minPlayers && !isLobby && (
          <p className="mt-3 alert-banner px-3 py-2 text-xs">
            {isDuelo
              ? "O duelo precisa de exatamente 2 jogadores"
              : isLsmp
                ? "A Lista Secreta 1v1 precisa de exatamente 2 jogadores"
                : `Mínimo de ${minPlayers} participantes para iniciar`}
          </p>
        )}
        {(isDuelo || isLsmp) && session.participants.length >= minPlayers && (
          <p className="mt-3 text-xs text-text-muted">
            Sala cheia — máximo de 2 jogadores.
          </p>
        )}
      </Card>

      {advanceError && (
        <p className="text-center text-sm text-red-400">{advanceError}</p>
      )}
      {restartError && (
        <p className="text-center text-sm text-red-400">{restartError}</p>
      )}
      {returnToLobbyError && (
        <p className="text-center text-sm text-red-400">{returnToLobbyError}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {session.status === "completed" ? (
          <>
            <Link href={`/s/${code}/results`}>
              <Button variant="gold" size="lg" className="w-full sm:w-auto">
                Ver resultados finais
              </Button>
            </Link>
            {session.isCreator && (
              <>
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={restarting}
                  onClick={handleRestart}
                  className="w-full sm:w-auto"
                >
                  {restarting ? "Reiniciando..." : "Jogar de novo"}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={returningToLobby}
                  onClick={handleReturnToLobby}
                  className="w-full sm:w-auto"
                >
                  {returningToLobby ? "Voltando..." : "Escolher outro modo"}
                </Button>
              </>
            )}
          </>
        ) : isSpectator ? (
          <>
            <div className="waiting-pill px-5 py-3 text-center text-sm text-off-white/85">
              Modo espectador — só assistindo.
            </div>
            {roundStatus === "voting" && (
              <Link href={`/s/${code}/vote`}>
                <Button size="lg" className="w-full sm:w-auto">
                  Acompanhar votação
                </Button>
              </Link>
            )}
            {roundStatus === "reveal" && (
              <Link href={`/s/${code}/reveal`}>
                <Button size="lg" className="w-full sm:w-auto">
                  Acompanhar debate
                </Button>
              </Link>
            )}
            {session.status === "active" && (
              <Link href={`/s/${code}/status`}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Acompanhar partida
                </Button>
              </Link>
            )}
          </>
        ) : isDuelo && session.status === "active" ? (
          <Link href={`/s/${code}/duelo`}>
            <Button size="lg" className="w-full sm:w-auto">
              {session.dueloView?.isMyTurn ? "Sua vez — ir jogar" : "Ir para o duelo"}
            </Button>
          </Link>
        ) : isLsmp && session.status === "active" ? (
          <Link href={`/s/${code}/lista-secreta`}>
            <Button size="lg" className="w-full sm:w-auto">
              {session.listaSecretaMpView?.isMyTurn
                ? "Sua vez — ir jogar"
                : "Ir para a partida"}
            </Button>
          </Link>
        ) : showRevealActions ? (
          <>
            <Link href={`/s/${code}/reveal`}>
              <Button size="lg" className="w-full sm:w-auto">
                Ver listas e debater
              </Button>
            </Link>
            {session.isCreator && advanceAction && (
              <Button
                variant="gold"
                size="lg"
                disabled={!advanceAction.canAdvance || advancing}
                onClick={handleAdvance}
                className="w-full sm:w-auto"
              >
                {advancing ? "Abrindo..." : advanceAction.label}
              </Button>
            )}
          </>
        ) : showVoteActions ? (
          <>
            {myParticipant && !myParticipant.hasVoted && (
              <Link href={`/s/${code}/vote`}>
                <Button size="lg" className="w-full sm:w-auto">
                  Ir votar
                </Button>
              </Link>
            )}
            {myParticipant?.hasVoted && (
              <div className="waiting-pill px-5 py-3 text-center text-sm text-off-white/85">
                Você votou! Aguardando criador encerrar a rodada.
              </div>
            )}
            {session.isCreator && advanceAction && (
              <Button
                variant="gold"
                size="lg"
                disabled={!advanceAction.canAdvance || advancing}
                onClick={handleAdvance}
                className="w-full sm:w-auto"
              >
                {advancing ? "Encerrando..." : advanceAction.label}
              </Button>
            )}
            {myParticipant?.hasVoted && (
              <Link href={`/s/${code}/vote`}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Ver votação
                </Button>
              </Link>
            )}
          </>
        ) : roundStatus === "completed" &&
          session.currentRoundNumber < session.totalRounds ? (
          <>
            <Link href={`/s/${code}/status`}>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Ver resultado da rodada
              </Button>
            </Link>
            {session.isCreator && advanceAction && (
              <Button
                variant="gold"
                size="lg"
                disabled={!advanceAction.canAdvance || advancing}
                onClick={handleAdvance}
                className="w-full sm:w-auto"
              >
                {advancing ? "Iniciando..." : advanceAction.label}
              </Button>
            )}
          </>
        ) : showPickActions && myParticipant ? (
          myParticipant.status === "confirmed" ? (
            <>
              <div className="waiting-pill px-5 py-3 text-center text-sm text-off-white/85">
                Você confirmou!{" "}
                {advanceAction?.canAdvance
                  ? "Aguardando criador iniciar votação."
                  : "Aguardando os outros confirmarem."}
              </div>
              {session.isCreator && advanceAction && (
                <Button
                  variant="gold"
                  size="lg"
                  disabled={!advanceAction.canAdvance || advancing}
                  onClick={handleAdvance}
                  className="w-full sm:w-auto"
                >
                  {advancing ? "Iniciando..." : advanceAction.label}
                </Button>
              )}
            </>
          ) : (
            <Link href={`/s/${code}/pick`}>
              <Button size="lg" className="w-full sm:w-auto">
                {isImpostor ? "Escolher carta" : "Montar meu ranking"}
              </Button>
            </Link>
          )
        ) : session.status === "setup" ? (
          isLobby ? (
            <p className="text-center text-sm text-on-pitch-muted">
              {session.isCreator
                ? "Escolha um modo acima para configurar a partida."
                : "Aguardando o criador escolher o modo de jogo."}
            </p>
          ) : session.isCreator && advanceAction ? (
            <>
              <Button
                variant="gold"
                size="lg"
                disabled={!advanceAction.canAdvance || advancing}
                onClick={handleAdvance}
                className="w-full sm:w-auto"
              >
                {advancing ? "Iniciando..." : advanceAction.label}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                disabled={returningToLobby}
                onClick={handleReturnToLobby}
                className="w-full sm:w-auto"
              >
                {returningToLobby ? "Voltando..." : "Trocar modo"}
              </Button>
              {!advanceAction.canAdvance && session.totalRounds === 0 && !isDuelo && !isLsmp && (
                <p className="text-center text-sm text-on-pitch-muted">
                  Adicione pelo menos 1 rodada
                </p>
              )}
              {!advanceAction.canAdvance &&
                isDuelo &&
                !session.umSoTotalRounds && (
                  <p className="text-center text-sm text-on-pitch-muted">
                    Configure o número de rodadas para iniciar
                  </p>
                )}
              {!advanceAction.canAdvance &&
                isLsmp &&
                (!session.listaSecretaTotalRounds || !session.listaSecretaSlotCount) && (
                  <p className="text-center text-sm text-on-pitch-muted">
                    Configure rodadas e jogadores secretos para iniciar
                  </p>
                )}
              {!advanceAction.canAdvance &&
                session.participants.length < minPlayers && (
                  <p className="text-center text-sm text-on-pitch-muted">
                    {isDuelo || isLsmp
                      ? "Aguardando oponente (2 jogadores)"
                      : "Aguardando mais participantes"}
                  </p>
                )}
              {!advanceAction.canAdvance &&
                isImpostor &&
                !session.impostorThemeId && (
                  <p className="text-center text-sm text-on-pitch-muted">
                    Escolha um tema para iniciar
                  </p>
                )}
            </>
          ) : (
            <p className="text-center text-sm text-on-pitch-muted">
              {isImpostor
                ? "Aguardando criador escolher o tema e iniciar"
                : isDuelo
                  ? "Aguardando criador configurar e iniciar o duelo"
                  : isLsmp
                    ? "Aguardando criador configurar e iniciar a partida"
                    : "Aguardando criador configurar e iniciar a sala"}
            </p>
          )
        ) : (
          <p className="text-center text-sm text-on-pitch-muted">
            Entre na sala para participar
          </p>
        )}
      </div>
    </div>
  );
}
