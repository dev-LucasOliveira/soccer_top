import { Target, Link2, Trophy } from "lucide-react";
import { SessionForm } from "@/components/session-form";
import { JoinForm } from "@/components/join-form";
import { APP_SLOGAN } from "@/lib/branding";

const STEPS = [
  { icon: Target, text: "Crie a sala e configure as rodadas" },
  { icon: Link2, text: "Compartilhe o código da sala" },
  { icon: Trophy, text: "Compare os rankings no final" },
];

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:py-12">
      <div
        className="pointer-events-none absolute inset-x-0 top-8 mx-auto h-48 w-48 rounded-full border border-off-white/[0.04] sm:h-64 sm:w-64"
        aria-hidden
      />

      <div className="relative mb-10 text-center">
        <p className="font-display text-2xl text-off-white/95 sm:text-3xl">
          {APP_SLOGAN}
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-on-pitch-muted">
          Monte rankings, vote na resenha e descubra quem tem o melhor critério
          — ou a pior desculpa.
        </p>
      </div>

      <div className="relative mb-8 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="glass-dark rounded-2xl px-4 py-4 text-center transition-colors duration-200 hover:bg-off-white/[0.08]"
          >
            <Icon
              size={20}
              strokeWidth={1.5}
              className="mx-auto text-gold/80"
            />
            <p className="mt-2 text-sm leading-snug text-on-pitch-muted">{text}</p>
          </div>
        ))}
      </div>

      <div className="relative grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 flex items-center gap-2.5 text-off-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-off-white/25 text-xs font-medium text-on-pitch-muted">
              1
            </span>
            <span className="font-display text-lg">Criar sala</span>
          </h2>
          <SessionForm />
        </div>
        <div>
          <h2 className="mb-4 flex items-center gap-2.5 text-off-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-off-white/25 text-xs font-medium text-on-pitch-muted">
              2
            </span>
            <span className="font-display text-lg">Entrar em uma sala</span>
          </h2>
          <JoinForm />
        </div>
      </div>
    </main>
  );
}
