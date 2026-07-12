import { Target, Link2, Trophy, User } from "lucide-react";
import Link from "next/link";
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

      <div className="relative mb-8">
        <div className="glass-dark rounded-2xl px-5 py-5 transition-colors duration-200 hover:bg-off-white/[0.08]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <User
                size={22}
                strokeWidth={1.5}
                className="mt-0.5 shrink-0 text-gold/80"
              />
              <div>
                <h2 className="font-display text-lg text-off-white">Modo solo</h2>
                <p className="mt-1 text-sm leading-snug text-on-pitch-muted">
                  Monte seu Top N, personalize o tema e exporte uma imagem.
                </p>
              </div>
            </div>
            <Link
              href="/solo"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-gold/35 bg-gradient-to-b from-gold-light to-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground shadow-sm transition-opacity duration-200 hover:opacity-90"
            >
              Criar meu ranking →
            </Link>
          </div>
        </div>
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
