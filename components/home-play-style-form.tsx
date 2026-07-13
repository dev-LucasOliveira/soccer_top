"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { JoinForm } from "@/components/join-form";
import { getOrCreateGuestToken } from "@/lib/guest";
import { setSoloDisplayName } from "@/lib/solo-profile";
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
  const [playStyle, setPlayStyle] = useState<PlayStyle | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playStyle) return;

    setLoading(true);
    setError("");

    try {
      if (playStyle === "solo") {
        setSoloDisplayName(displayName);
        router.push("/solo/lobby");
        return;
      }

      const guestToken = getOrCreateGuestToken();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          guestToken,
          gameMode: "lobby",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem(`participant_${data.code}`, data.participantId);
      router.push(`/s/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao continuar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {PLAY_STYLES.map((style) => {
          const Icon = style.icon;
          const selected = playStyle === style.id;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => {
                setPlayStyle(style.id);
                setShowJoin(false);
                setError("");
              }}
              className={cn(
                "rounded-2xl border px-4 py-5 text-left transition-colors duration-200",
                selected
                  ? "border-gold/40 bg-gold/10"
                  : "border-off-white/10 bg-off-white/[0.04] hover:border-off-white/18 hover:bg-off-white/[0.06]"
              )}
            >
              <span className="mb-3 inline-flex rounded-full bg-off-white/[0.06] p-2">
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className={selected ? "text-gold" : "text-gold/65"}
                />
              </span>
              <p className="font-display text-lg text-off-white">{style.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-on-pitch-muted">
                {style.description}
              </p>
            </button>
          );
        })}
      </div>

      {playStyle && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Seu nome</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como você quer aparecer"
                required
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? "Entrando..."
                : playStyle === "multiplayer"
                  ? "Criar sala"
                  : "Ir para o lobby solo"}
            </Button>
          </form>

          {playStyle === "multiplayer" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 pt-4">
                <div className="h-px flex-1 bg-card-border" aria-hidden />
                <p className="shrink-0 text-xs font-medium tracking-wide text-text-muted">
                  Ou entre em uma sala existente
                </p>
                <div className="h-px flex-1 bg-card-border" aria-hidden />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setShowJoin((value) => !value)}
              >
                <KeyRound size={16} strokeWidth={2} aria-hidden />
                {showJoin ? "Ocultar formulário" : "Já tenho um código"}
              </Button>
              {showJoin && (
                <div className="rounded-xl border border-card-border bg-surface-inset p-4">
                  <JoinForm />
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
