"use client";

import { MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceChat } from "./voice-chat-provider";

export function VoiceUnavailableBanner() {
  const { availability, showUnavailableBanner, dismissUnavailableBanner } =
    useVoiceChat();

  if (!showUnavailableBanner || availability.enabled) {
    return null;
  }

  const message = availability.message;
  if (!message) return null;

  return (
    <div className="rounded-xl border border-gold/30 bg-pitch/80 px-4 py-3 text-sm text-off-white shadow-lg backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-full bg-gold/15 p-2 text-gold-light">
          <MicOff size={16} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base text-gold-light">{message.title}</p>
          <p className="mt-1 leading-relaxed text-on-pitch-muted">{message.body}</p>
          <p className="mt-2 text-xs text-on-pitch-subtle">{message.discordHint}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={dismissUnavailableBanner}
          >
            {message.ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
