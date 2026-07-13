"use client";

import { useState } from "react";
import {
  Eye,
  List,
  Sparkles,
  Swords,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  getMultiplayerGameModes,
  type GameModeIconId,
} from "@/lib/game-modes";
import {
  getModeDisabledReason,
  isModeAvailableForPlayerCount,
} from "@/lib/mode-constraints";
import { getGuestToken } from "@/lib/guest";
import type { PlayableGameMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<GameModeIconId, LucideIcon> = {
  trophy: Trophy,
  eye: Eye,
  target: Target,
  list: List,
  sparkles: Sparkles,
  swords: Swords,
};

type LobbyModeSelectorProps = {
  code: string;
  participantId: string;
  playerCount: number;
  onModeSelected: () => void;
};

export function LobbyModeSelector({
  code,
  participantId,
  playerCount,
  onModeSelected,
}: LobbyModeSelectorProps) {
  const [loadingMode, setLoadingMode] = useState<PlayableGameMode | null>(null);
  const [error, setError] = useState("");
  const modes = getMultiplayerGameModes();

  async function handleSelectMode(gameMode: PlayableGameMode) {
    if (!isModeAvailableForPlayerCount(gameMode, playerCount)) return;

    setLoadingMode(gameMode);
    setError("");

    try {
      const res = await fetch(`/api/sessions/${code}/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameMode,
          participantId,
          guestToken: getGuestToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onModeSelected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao escolher modo");
    } finally {
      setLoadingMode(null);
    }
  }

  return (
    <Card>
      <h2 className="mb-2 font-display text-lg text-foreground">Escolha o modo</h2>
      <p className="mb-4 text-sm text-text-muted">
        {playerCount} jogador{playerCount === 1 ? "" : "es"} na sala. Modos
        indisponíveis dependem da quantidade de participantes.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map((mode) => {
          const gameMode = mode.sessionGameMode as PlayableGameMode;
          const disabled = !isModeAvailableForPlayerCount(gameMode, playerCount);
          const reason = getModeDisabledReason(gameMode, playerCount);
          const Icon = MODE_ICONS[mode.icon];

          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled || loadingMode !== null}
              onClick={() => handleSelectMode(gameMode)}
              className={cn(
                "rounded-xl border px-4 py-4 text-left transition-colors",
                disabled
                  ? "cursor-not-allowed border-card-border/60 bg-off-white-muted/40 opacity-60"
                  : "border-card-border bg-off-white-muted hover:border-pitch/30 hover:bg-surface-elevated"
              )}
            >
              <span className="mb-2 inline-flex rounded-full bg-off-white/[0.06] p-2">
                <Icon size={18} className="text-gold/80" />
              </span>
              <p className="font-medium text-foreground">{mode.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                {disabled ? reason : mode.cardDescription}
              </p>
              {loadingMode === gameMode && (
                <p className="mt-2 text-xs text-gold">Selecionando...</p>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </Card>
  );
}
