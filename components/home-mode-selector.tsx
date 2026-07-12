"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, List, Target, Trophy, User, Users, type LucideIcon } from "lucide-react";
import { CreateSessionForm } from "@/components/create-session-form";
import { SoloGuessPanel } from "@/components/solo-guess-panel";
import { SoloSetupForm } from "@/components/solo-setup-form";
import {
  DEFAULT_HOME_MODE,
  GAME_MODES,
  getGameModeConfig,
  parseHomeModeParam,
  type GameModeIconId,
  type GameModePlayStyle,
  type HomeModeId,
} from "@/lib/game-modes";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<GameModeIconId, LucideIcon> = {
  trophy: Trophy,
  eye: Eye,
  target: Target,
  list: List,
};

const PLAY_STYLE_META: Record<
  GameModePlayStyle,
  { icon: LucideIcon; label: string }
> = {
  multiplayer: { icon: Users, label: "Multiplayer" },
  solo: { icon: User, label: "Solo" },
};

export function HomeModeSelector({ initialMode }: { initialMode?: HomeModeId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeFromUrl = parseHomeModeParam(searchParams.get("mode"));

  const [selectedMode, setSelectedMode] = useState<HomeModeId>(
    initialMode ?? modeFromUrl ?? DEFAULT_HOME_MODE,
  );

  useEffect(() => {
    const urlMode = parseHomeModeParam(searchParams.get("mode"));
    if (urlMode) {
      setSelectedMode(urlMode);
    }
  }, [searchParams]);

  const selectMode = useCallback(
    (mode: HomeModeId) => {
      setSelectedMode(mode);
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", mode);
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const active = getGameModeConfig(selectedMode);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {GAME_MODES.map((mode) => {
          const Icon = MODE_ICONS[mode.icon];
          const isActive = mode.id === selectedMode;
          const playStyle = PLAY_STYLE_META[mode.playStyle];
          const PlayStyleIcon = playStyle.icon;

          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => selectMode(mode.id)}
              className={cn(
                "relative cursor-pointer rounded-2xl border px-4 py-4 text-left transition-colors duration-200",
                isActive
                  ? "border-gold/45 bg-gold/[0.08] ring-1 ring-gold/15"
                  : "border-off-white/10 bg-off-white/[0.04] hover:border-off-white/18 hover:bg-off-white/[0.06]",
              )}
            >
              <span
                className={cn(
                  "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5",
                  isActive
                    ? "bg-gold/15 text-gold/90"
                    : "bg-off-white/[0.06] text-on-pitch-subtle",
                )}
                title={playStyle.label}
                aria-label={playStyle.label}
              >
                <PlayStyleIcon size={12} strokeWidth={2} aria-hidden />
              </span>
              <span
                className={cn(
                  "mb-3 inline-flex rounded-full p-2",
                  isActive ? "bg-gold/15" : "bg-off-white/[0.06]",
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className={cn(isActive ? "text-gold" : "text-gold/65")}
                />
              </span>
              <p
                className={cn(
                  "font-display text-base",
                  isActive ? "text-off-white" : "text-off-white/85",
                )}
              >
                {mode.label}
              </p>
              <p
                className={cn(
                  "mt-1 text-sm leading-snug",
                  isActive ? "text-on-pitch-muted" : "text-on-pitch-subtle",
                )}
              >
                {mode.cardDescription}
              </p>
            </button>
          );
        })}
      </div>

      <div className="glass-dark rounded-2xl px-5 py-5">
        <h2 className="font-display text-xl text-off-white">{active.label}</h2>
        <p className="mt-2 text-sm leading-relaxed text-on-pitch-muted">
          {active.panelDescription}
        </p>
        <p className="mt-3 text-xs text-gold-light/90">{active.hint}</p>

        <div className="mt-5">
          {active.sessionGameMode ? (
            <CreateSessionForm
              gameMode={active.sessionGameMode}
              submitLabel={active.submitLabel}
            />
          ) : active.id === "adivinhe" ? (
            <SoloGuessPanel />
          ) : (
            <SoloSetupForm submitLabel={active.submitLabel} />
          )}
        </div>
      </div>
    </div>
  );
}
