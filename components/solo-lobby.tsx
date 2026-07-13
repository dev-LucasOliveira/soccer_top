"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  List,
  Sparkles,
  Swords,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getSoloGameModes,
  type GameModeIconId,
} from "@/lib/game-modes";
import { getSoloDisplayName } from "@/lib/solo-profile";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<GameModeIconId, LucideIcon> = {
  trophy: Trophy,
  eye: Eye,
  target: Target,
  list: List,
  sparkles: Sparkles,
  swords: Swords,
};

export function SoloLobby() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const modes = getSoloGameModes();

  useEffect(() => {
    const name = getSoloDisplayName();
    if (!name) {
      router.replace("/");
      return;
    }
    setDisplayName(name);
  }, [router]);

  if (!displayName) {
    return (
      <p className="loading-pulse text-center text-on-pitch-muted">Carregando...</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-on-pitch-muted">Jogando como</p>
        <p className="font-display text-xl text-off-white">{displayName}</p>
      </div>

      <Card>
        <h2 className="mb-4 font-display text-lg text-foreground">
          Escolha o modo solo
        </h2>
        <div className="grid gap-3">
          {modes.map((mode) => {
            const Icon = MODE_ICONS[mode.icon];

            return (
              <Link
                key={mode.id}
                href={mode.landingPath}
                className={cn(
                  "rounded-xl border border-card-border bg-off-white-muted px-4 py-4 transition-colors",
                  "hover:border-pitch/30 hover:bg-surface-elevated"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex rounded-full bg-off-white/[0.06] p-2">
                    <Icon size={18} className="text-gold/80" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{mode.label}</p>
                    <p className="mt-1 text-sm text-text-muted">
                      {mode.cardDescription}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <div className="text-center">
        <Link href="/">
          <Button variant="secondary">Trocar nome / voltar ao início</Button>
        </Link>
      </div>
    </div>
  );
}
