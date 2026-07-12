import Link from "next/link";
import {
  Eye,
  List,
  Sparkles,
  Swords,
  Target,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  getGameModeConfig,
  type GameModeConfig,
  type GameModeIconId,
  type HomeModeId,
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

const PLAY_STYLE_META = {
  multiplayer: { icon: Users, label: "Multiplayer" },
  solo: { icon: User, label: "Solo" },
} as const;

export function ModeLandingPage({
  modeId,
  children,
  showRules = true,
}: {
  modeId: HomeModeId;
  children: React.ReactNode;
  showRules?: boolean;
}) {
  const mode = getGameModeConfig(modeId);
  return <ModeLandingContent mode={mode} showRules={showRules}>{children}</ModeLandingContent>;
}

function ModeLandingContent({
  mode,
  children,
  showRules,
}: {
  mode: GameModeConfig;
  children: React.ReactNode;
  showRules: boolean;
}) {
  const Icon = MODE_ICONS[mode.icon];
  const playStyle = PLAY_STYLE_META[mode.playStyle];
  const PlayStyleIcon = playStyle.icon;

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-on-pitch-muted transition-colors duration-200 hover:text-off-white"
      >
        ← Voltar ao início
      </Link>

      <div className="mb-6 flex items-start gap-4">
        <span className="inline-flex rounded-full bg-gold/15 p-3">
          <Icon size={24} strokeWidth={1.5} className="text-gold" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl text-off-white sm:text-3xl">
              {mode.label}
            </h1>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
                "bg-off-white/[0.06] text-on-pitch-subtle"
              )}
            >
              <PlayStyleIcon size={12} strokeWidth={2} aria-hidden />
              {playStyle.label}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-on-pitch-muted">
            {mode.panelDescription}
          </p>
        </div>
      </div>

      {showRules && mode.rules && mode.rules.length > 0 && (
        <ul className="mb-4 space-y-1 text-sm text-on-pitch-subtle">
          {mode.rules.map((rule) => (
            <li key={rule}>· {rule}</li>
          ))}
        </ul>
      )}

      <p className="mb-6 text-xs text-gold-light/90">{mode.hint}</p>

      <div className="glass-dark rounded-2xl px-5 py-5">{children}</div>
    </main>
  );
}
