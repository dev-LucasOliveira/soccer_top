import { Suspense } from "react";
import { JoinForm } from "@/components/join-form";
import { HomeModeSelector } from "@/components/home-mode-selector";
import { APP_SLOGAN } from "@/lib/branding";
import { parseHomeModeParam } from "@/lib/game-modes";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const initialMode = parseHomeModeParam(mode ?? null) ?? undefined;

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
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-pitch-muted">
          Tradicional, Impostor, Lista Secreta ou monte um ranking livre.
        </p>
      </div>

      <div className="relative mb-10">
        <Suspense>
          <HomeModeSelector initialMode={initialMode} />
        </Suspense>
      </div>

      <div className="relative">
        <h2 className="mb-4 font-display text-lg text-off-white">
          Entrar em uma sala
        </h2>
        <JoinForm />
      </div>
    </main>
  );
}
