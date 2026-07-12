"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, List, Target, Trophy, type LucideIcon } from "lucide-react";
import { CreateSessionForm } from "@/components/create-session-form";
import { SoloGuessPanel } from "@/components/solo-guess-panel";
import { SoloSetupForm } from "@/components/solo-setup-form";
import {
  DEFAULT_HOME_MODE,
  GAME_MODES,
  getGameModeConfig,
  parseHomeModeParam,
  type GameModeIconId,
  type HomeModeId,
} from "@/lib/game-modes";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<GameModeIconId, LucideIcon> = {
  trophy: Trophy,
  eye: Eye,
  target: Target,
  list: List,
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

          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => selectMode(mode.id)}
              className={cn(
                "cursor-pointer rounded-2xl px-4 py-4 text-left transition-all duration-200",
                isActive
                  ? "border-2 border-gold bg-gold/20 shadow-[0_0_0_1px_rgba(197,162,93,0.35),0_8px_24px_rgba(197,162,93,0.18)]"
                  : "border border-off-white/12 bg-off-white/[0.04] opacity-65 hover:border-off-white/22 hover:bg-off-white/[0.07] hover:opacity-90",
              )}
            >
              <span
                className={cn(
                  "mb-3 inline-flex rounded-full p-2",
                  isActive ? "bg-gold/25" : "bg-off-white/[0.06]",
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className={cn(isActive ? "text-gold-light" : "text-gold/55")}
                />
              </span>
              <p
                className={cn(
                  "font-display text-base",
                  isActive ? "text-gold-light" : "text-off-white/75",
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
