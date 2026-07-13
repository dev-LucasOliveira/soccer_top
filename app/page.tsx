import { HomePlayStyleForm } from "@/components/home-play-style-form";
import { HomeSeoSection } from "@/components/seo/home-seo-section";
import { APP_NAME, APP_SLOGAN } from "@/lib/branding";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Jogo de futebol online multiplayer — quiz e rankings com amigos",
  description: `${APP_SLOGAN}. Crie salas grátis, monte Top N de jogadores, vote com amigos e jogue modos solo no ${APP_NAME}.`,
  path: "/",
});

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-full w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:py-12">
      <div
        className="pointer-events-none absolute inset-x-0 top-8 mx-auto h-48 w-48 rounded-full border border-off-white/[0.04] sm:h-64 sm:w-64"
        aria-hidden
      />

      <div className="relative mb-10 text-center">
        <h1 className="sr-only">
          {APP_NAME} — {APP_SLOGAN}
        </h1>
        <p className="font-display text-2xl text-off-white/95 sm:text-3xl">
          {APP_SLOGAN}
        </p>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-on-pitch-muted">
          Escolha como jogar — o modo fica para o lobby.
        </p>
      </div>

      <div className="relative">
        <HomePlayStyleForm />
      </div>

      <HomeSeoSection />
    </main>
  );
}
