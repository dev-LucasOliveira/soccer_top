import Link from "next/link";
import { APP_NAME, APP_SLOGAN } from "@/lib/branding";
import {
  getMultiplayerGameModes,
  getSoloGameModes,
} from "@/lib/game-modes";

export function HomeSeoSection() {
  const multiplayerModes = getMultiplayerGameModes();
  const soloModes = getSoloGameModes();

  return (
    <section
      className="mx-auto mt-16 max-w-3xl border-t border-off-white/[0.06] pt-10"
      aria-labelledby="home-about"
    >
      <h2 id="home-about" className="font-display text-2xl text-off-white">
        O que é {APP_NAME}?
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-on-pitch-muted">
        {APP_SLOGAN}. {APP_NAME} é um quiz de futebol online grátis para
        montar rankings, votar nas melhores listas e disputar quem entende mais
        do esporte — sozinho ou com amigos, direto no navegador.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-on-pitch-muted">
        Crie uma sala multiplayer, escolha o modo no lobby e compartilhe o
        link. Ou jogue solo: adivinhe jogadores secretos, monte rankings
        personalizados e exporte imagens para compartilhar.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-on-pitch-muted">
        Curte jogos de futebol no navegador como o{" "}
        <a
          href="https://7a0.com.br"
          className="text-gold-light underline-offset-2 hover:underline"
          rel="noopener noreferrer"
        >
          7a0
        </a>
        ? O {APP_NAME} é outra opção — mais resenha e rankings com amigos do que
        simulação de Copa.
      </p>

      <h3 className="mt-8 font-display text-lg text-off-white">
        Modos multiplayer
      </h3>
      <ul className="mt-3 space-y-2 text-sm text-on-pitch-muted">
        {multiplayerModes.map((mode) => (
          <li key={mode.id}>
            <Link
              href={mode.landingPath}
              className="text-gold-light underline-offset-2 hover:underline"
            >
              {mode.label}
            </Link>
            {" — "}
            {mode.cardDescription}
          </li>
        ))}
      </ul>

      <h3 className="mt-8 font-display text-lg text-off-white">Modos solo</h3>
      <ul className="mt-3 space-y-2 text-sm text-on-pitch-muted">
        {soloModes.map((mode) => (
          <li key={mode.id}>
            <Link
              href={mode.landingPath}
              className="text-gold-light underline-offset-2 hover:underline"
            >
              {mode.label}
            </Link>
            {" — "}
            {mode.cardDescription}
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-on-pitch-subtle">
        <Link href="/como-jogar" className="text-gold-light hover:underline">
          Como jogar
        </Link>
        {" · "}
        <Link href="/faq" className="text-gold-light hover:underline">
          Perguntas frequentes
        </Link>
      </p>
    </section>
  );
}
