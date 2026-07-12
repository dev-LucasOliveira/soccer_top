import Link from "next/link";
import { Eye, List, Sparkles, Swords, Target, Trophy, User, Users, type LucideIcon } from "lucide-react";
import {
  GAME_MODES,
  type GameModeIconId,
  type GameModePlayStyle,
} from "@/lib/game-modes";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<GameModeIconId, LucideIcon> = {
  trophy: Trophy,
  eye: Eye,
  target: Target,
  list: List,
  sparkles: Sparkles,
  swords: Swords,
};

const PLAY_STYLE_META: Record<
  GameModePlayStyle,
  { icon: LucideIcon; label: string }
> = {
  multiplayer: { icon: Users, label: "Multiplayer" },
  solo: { icon: User, label: "Solo" },
};

export function HomeModeSelector() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {GAME_MODES.map((mode) => {
        const Icon = MODE_ICONS[mode.icon];
        const playStyle = PLAY_STYLE_META[mode.playStyle];
        const PlayStyleIcon = playStyle.icon;

        return (
          <Link
            key={mode.id}
            href={mode.landingPath}
            className={cn(
              "group relative rounded-2xl border px-4 py-4 text-left transition-colors duration-200",
              "border-off-white/10 bg-off-white/[0.04] hover:border-off-white/18 hover:bg-off-white/[0.06]"
            )}
          >
            <span
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-off-white/[0.06] px-1.5 py-0.5 text-on-pitch-subtle"
              title={playStyle.label}
              aria-label={playStyle.label}
            >
              <PlayStyleIcon size={12} strokeWidth={2} aria-hidden />
            </span>
            <span className="mb-3 inline-flex rounded-full bg-off-white/[0.06] p-2 transition-colors group-hover:bg-gold/15">
              <Icon
                size={20}
                strokeWidth={1.5}
                className="text-gold/65 transition-colors group-hover:text-gold"
              />
            </span>
            <p className="font-display text-base text-off-white/85 transition-colors group-hover:text-off-white">
              {mode.label}
            </p>
            <p className="mt-1 text-sm leading-snug text-on-pitch-subtle">
              {mode.cardDescription}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
