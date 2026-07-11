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
import { getGuestToken } from "@/lib/guest";
import { Copy, Check, Users, Share2, ListOrdered } from "lucide-react";
import { describeSessionFilters } from "@/lib/session-info";
import { getPlayers } from "@/lib/participants";
import type {
  CurrentRound,
  RoundSummary,
  SessionFinalResult,
  SessionFilters,
  StandingEntry,
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
  topN: number;
  status: string;
  currentRoundNumber: number;
  totalRounds: number;
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

  const fetchSession = async () => {
    try {
      const params = participantId
        ? `?participantId=${participantId}`
        : "";
      const res = await fetch(`/api/sessions/${code}${params}`);
      const data = await res.json();
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

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/s/${code}`
      : `/s/${code}`;

  async function copyLink() {
    const ok = await copyToClipboard(shareUrl);
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

  function participantBadge(p: Participant) {
    if (p.status === "spectator") return "Espectador";
    if (roundStatus === "voting") {
      return p.hasVoted ? "Votou" : "Aguardando voto";
    }
    if (p.status === "confirmed") return "Confirmado";
    return `Montando ${p.pickCount}/${session!.topN}`;
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

      {session.standings.length > 0 && (
        <StandingsTable standings={session.standings} />
      )}

      <Card>
        <div className="mb-3 flex items-center gap-2 text-foreground">
          <ListOrdered size={18} className="text-pitch" />
          <h2 className="font-display text-lg text-foreground">Como funciona esta sala</h2>
        </div>
        <p className="mb-4 text-sm text-text-muted">{phase.description}</p>
        <div className="-mx-5 flex gap-2 overflow-x-auto scroll-smooth px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className={`min-w-[4.75rem] shrink-0 rounded-lg border p-2 text-center text-xs leading-tight transition-colors duration-200 sm:min-w-0 sm:shrink ${
                phase.step >= s.num
                  ? "border-pitch/20 bg-white font-medium text-foreground shadow-sm"
                  : "border-card-border bg-white text-foreground/70"
              }`}
            >
              <div
                className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  phase.step >= s.num
                    ? "bg-pitch text-off-white"
                    : "border border-card-border bg-off-white text-foreground/70"
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
        <RoundSetupPanel
          code={code}
          participantId={participantId}
          rounds={session.rounds}
          isCreator={session.isCreator}
          onRefresh={fetchSession}
        />
      ) : (
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
                  <p className="text-xs text-text-muted">Top de {round.topN}</p>
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
                      ? "Montando"
                      : round.status === "voting"
                        ? "Votando"
                        : "Encerrado"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {session.currentRound && session.status === "active" && (
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
          {shareUrl}
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
              <Badge variant={participantBadgeVariant(p)} className="self-start sm:self-auto">
                {participantBadge(p)}
              </Badge>
            </div>
          ))}
        </div>
        {session.participants.length < 2 && (
          <p className="mt-3 alert-banner px-3 py-2 text-xs">
            Mínimo de 2 participantes para iniciar
          </p>
        )}
      </Card>

      {advanceError && (
        <p className="text-center text-sm text-red-400">{advanceError}</p>
      )}
      {restartError && (
        <p className="text-center text-sm text-red-400">{restartError}</p>
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
              <Button
                variant="secondary"
                size="lg"
                disabled={restarting}
                onClick={handleRestart}
                className="w-full sm:w-auto"
              >
                {restarting ? "Reiniciando..." : "Começar novo jogo"}
              </Button>
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
            {session.status === "active" && (
              <Link href={`/s/${code}/status`}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Acompanhar partida
                </Button>
              </Link>
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
                Montar meu ranking
              </Button>
            </Link>
          )
        ) : session.status === "setup" ? (
          session.isCreator && advanceAction ? (
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
              {!advanceAction.canAdvance && session.totalRounds === 0 && (
                <p className="text-center text-sm text-on-pitch-muted">
                  Adicione pelo menos 1 rodada
                </p>
              )}
              {!advanceAction.canAdvance &&
                session.totalRounds > 0 &&
                session.participants.length < 2 && (
                  <p className="text-center text-sm text-on-pitch-muted">
                    Aguardando mais participantes
                  </p>
                )}
            </>
          ) : (
            <p className="text-center text-sm text-on-pitch-muted">
              Aguardando criador configurar e iniciar a sala
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
