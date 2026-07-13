"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { KeyRound, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { getOrCreateGuestToken } from "@/lib/guest";
import { setSoloDisplayName } from "@/lib/solo-profile";
import { buildParticipantPath } from "@/lib/session-info";
import { cn } from "@/lib/utils";

type PlayStyle = "multiplayer" | "solo";

const PLAY_STYLES: {
  id: PlayStyle;
  label: string;
  description: string;
  icon: typeof Users;
}[] = [
  {
    id: "multiplayer",
    label: "Multiplayer",
    description: "Crie uma sala online e escolha o modo com seus amigos.",
    icon: Users,
  },
  {
    id: "solo",
    label: "Solo",
    description: "Jogue sozinho e escolha o modo no lobby.",
    icon: User,
  },
];

export function HomePlayStyleForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loadingStyle, setLoadingStyle] = useState<PlayStyle | null>(null);
  const [error, setError] = useState("");

  const [guestDialogStyle, setGuestDialogStyle] = useState<PlayStyle | null>(
    null
  );
  const [guestName, setGuestName] = useState("");
  const [guestError, setGuestError] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinNotice, setJoinNotice] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  const isLoggedIn =
    status === "authenticated" &&
    Boolean(session?.user?.usernameSet && session.user.username);

  const nickname = session?.user?.username ?? "";

  async function startMultiplayer(displayName?: string) {
    const guestToken = getOrCreateGuestToken();
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName || undefined,
        guestToken,
        gameMode: "lobby",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem(`participant_${data.code}`, data.participantId);
    router.push(`/s/${data.code}`);
  }

  async function startSolo(displayName: string) {
    setSoloDisplayName(displayName);
    router.push("/solo/lobby");
  }

  async function handleStyleClick(style: PlayStyle) {
    setError("");
    if (status === "loading") return;

    if (!isLoggedIn) {
      setGuestName("");
      setGuestError("");
      setGuestDialogStyle(style);
      return;
    }

    setLoadingStyle(style);
    try {
      if (style === "solo") {
        await startSolo(nickname);
      } else {
        await startMultiplayer();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao continuar");
      setLoadingStyle(null);
    }
  }

  async function handleGuestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guestDialogStyle) return;

    const name = guestName.trim();
    if (!name) {
      setGuestError("Nome é obrigatório");
      return;
    }

    setGuestLoading(true);
    setGuestError("");
    try {
      if (guestDialogStyle === "solo") {
        await startSolo(name);
      } else {
        await startMultiplayer(name);
      }
      setGuestDialogStyle(null);
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : "Erro ao continuar");
    } finally {
      setGuestLoading(false);
    }
  }

  async function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setJoinLoading(true);
    setJoinError("");
    setJoinNotice("");

    try {
      const sessionCode = joinCode.trim().toLowerCase().replace(/.*\/s\//, "");
      if (!sessionCode) {
        throw new Error("Informe o código da sala");
      }

      if (!isLoggedIn && !joinName.trim()) {
        throw new Error("Nome é obrigatório");
      }

      const guestToken = getOrCreateGuestToken();
      const res = await fetch(`/api/sessions/${sessionCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: isLoggedIn ? undefined : joinName.trim(),
          guestToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem(`participant_${sessionCode}`, data.participantId);

      if (data.isSpectator) {
        setJoinNotice(
          data.sessionStatus === "completed"
            ? "Jogo encerrado — você entrou como espectador."
            : "Partida já começou — você entrou como espectador."
        );
      }

      const sessionRes = await fetch(
        `/api/sessions/${sessionCode}?participantId=${data.participantId}`
      );
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        router.push(`/s/${sessionCode}`);
        return;
      }

      setJoinOpen(false);
      router.push(
        buildParticipantPath(sessionCode, sessionData, data.participantId)
      );
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setJoinLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {PLAY_STYLES.map((style) => {
          const Icon = style.icon;
          const busy = loadingStyle === style.id;

          return (
            <button
              key={style.id}
              type="button"
              disabled={loadingStyle !== null || status === "loading"}
              onClick={() => handleStyleClick(style.id)}
              className={cn(
                "rounded-2xl border px-4 py-5 text-left transition-colors duration-200",
                "border-off-white/10 bg-off-white/[0.04] hover:border-off-white/18 hover:bg-off-white/[0.06]",
                "disabled:cursor-wait disabled:opacity-70",
                busy && "border-gold/40 bg-gold/10"
              )}
            >
              <span className="mb-3 inline-flex rounded-full bg-off-white/[0.06] p-2">
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className={busy ? "text-gold" : "text-gold/65"}
                />
              </span>
              <p className="font-display text-lg text-off-white">{style.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-on-pitch-muted">
                {busy
                  ? style.id === "multiplayer"
                    ? "Criando sala..."
                    : "Abrindo lobby..."
                  : style.description}
              </p>
            </button>
          );
        })}
      </div>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <div className="flex justify-center">
        <Button
          type="button"
          variant="secondary"
          className="gap-2"
          onClick={() => {
            setJoinCode("");
            setJoinName("");
            setJoinError("");
            setJoinNotice("");
            setJoinOpen(true);
          }}
        >
          <KeyRound size={16} strokeWidth={2} aria-hidden />
          Já tenho um código
        </Button>
      </div>

      <Dialog
        open={guestDialogStyle !== null}
        onClose={() => {
          if (guestLoading) return;
          setGuestDialogStyle(null);
        }}
        title={
          guestDialogStyle === "solo"
            ? "Entrar no lobby solo"
            : "Criar sala multiplayer"
        }
      >
        <form onSubmit={handleGuestSubmit} className="space-y-4">
          <p className="text-sm text-text-muted">
            Escolha como você quer aparecer na partida.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">Seu nome</label>
            <Input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Como você quer aparecer"
              required
              autoFocus
              disabled={guestLoading}
            />
          </div>
          {guestError && <p className="text-sm text-red-400">{guestError}</p>}
          <Button type="submit" disabled={guestLoading} className="w-full">
            {guestLoading
              ? "Entrando..."
              : guestDialogStyle === "solo"
                ? "Ir para o lobby solo"
                : "Criar sala"}
          </Button>
        </form>
      </Dialog>

      <Dialog
        open={joinOpen}
        onClose={() => {
          if (joinLoading) return;
          setJoinOpen(false);
        }}
        title="Entrar em uma sala"
      >
        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Código da sala
            </label>
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Ex: abc123 ou link completo"
              required
              autoFocus
              disabled={joinLoading}
            />
          </div>

          {!isLoggedIn && (
            <div>
              <label className="mb-1 block text-sm font-medium">Seu nome</label>
              <Input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Como você quer aparecer"
                required
                disabled={joinLoading}
              />
            </div>
          )}

          {isLoggedIn && (
            <p className="text-sm text-text-muted">
              Você entra como <span className="text-foreground">@{nickname}</span>
            </p>
          )}

          {joinError && <p className="text-sm text-red-400">{joinError}</p>}
          {joinNotice && <p className="text-sm text-text-muted">{joinNotice}</p>}

          <Button type="submit" disabled={joinLoading} className="w-full">
            {joinLoading ? "Entrando..." : "Entrar na sala"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
