import Link from "next/link";
import { APP_NAME } from "@/lib/branding";
import {
  getMultiplayerGameModes,
  getSoloGameModes,
} from "@/lib/game-modes";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Como jogar",
  description: `Aprenda a criar salas, convidar amigos e jogar os modos multiplayer e solo do ${APP_NAME}.`,
  path: "/como-jogar",
});

export default function ComoJogarPage() {
  const multiplayerModes = getMultiplayerGameModes();
  const soloModes = getSoloGameModes();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-on-pitch-muted transition-colors duration-200 hover:text-off-white"
      >
        ← Voltar ao início
      </Link>

      <h1 className="font-display text-3xl text-off-white">Como jogar</h1>
      <p className="mt-3 text-sm leading-relaxed text-on-pitch-muted">
        {APP_NAME} funciona no navegador. Não precisa baixar app — crie uma
        sala ou escolha um modo solo e comece em segundos.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl text-off-white">
          Multiplayer com amigos
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-on-pitch-muted">
          <li>
            Na{" "}
            <Link href="/" className="text-gold-light hover:underline">
              página inicial
            </Link>
            , escolha <strong className="text-off-white">Multiplayer</strong> e
            digite seu nome.
          </li>
          <li>
            Uma sala é criada automaticamente. Você entra no lobby com um código
            e link para compartilhar.
          </li>
          <li>
            No lobby, o criador escolhe o modo (Tradicional, Impostor, Duelo ou
            Lista Secreta 1v1) e configura rodadas ou temas.
          </li>
          <li>
            Quando todos estiverem prontos, inicie a partida. Cada modo tem suas
            regras de montagem de listas, chutes ou votação.
          </li>
          <li>
            Ao final, veja o placar e exporte o resultado se quiser compartilhar.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-off-white">Modos multiplayer</h2>
        <ul className="mt-4 space-y-4">
          {multiplayerModes.map((mode) => (
            <li key={mode.id} className="text-sm text-on-pitch-muted">
              <Link
                href={mode.landingPath}
                className="font-medium text-gold-light hover:underline"
              >
                {mode.label}
              </Link>
              <p className="mt-1">{mode.panelDescription}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-off-white">Modos solo</h2>
        <p className="mt-3 text-sm text-on-pitch-muted">
          Na home, escolha <strong className="text-off-white">Solo</strong> para
          ir ao lobby solo e pickar um modo:
        </p>
        <ul className="mt-4 space-y-4">
          {soloModes.map((mode) => (
            <li key={mode.id} className="text-sm text-on-pitch-muted">
              <Link
                href={mode.landingPath}
                className="font-medium text-gold-light hover:underline"
              >
                {mode.label}
              </Link>
              <p className="mt-1">{mode.panelDescription}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-off-white">Entrar em sala existente</h2>
        <p className="mt-3 text-sm leading-relaxed text-on-pitch-muted">
          Se alguém já criou a sala, use o link <code className="text-off-white">/s/código</code>{" "}
          ou o botão &quot;Entrar em sala&quot; na home. Digite o código e seu nome para
          participar.
        </p>
      </section>

      <p className="mt-10 text-sm text-on-pitch-subtle">
        Dúvidas? Veja a{" "}
        <Link href="/faq" className="text-gold-light hover:underline">
          FAQ
        </Link>
        .
      </p>
    </main>
  );
}
