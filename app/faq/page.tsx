import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { APP_NAME } from "@/lib/branding";
import { buildFaqJsonLd, buildPageMetadata, FAQ_ITEMS } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Perguntas frequentes",
  description: `Tire dúvidas sobre modos, salas, chat de voz e como jogar ${APP_NAME} grátis no navegador.`,
  path: "/faq",
});

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <JsonLd data={buildFaqJsonLd(FAQ_ITEMS)} />

      <Link
        href="/"
        className="mb-6 inline-block text-sm text-on-pitch-muted transition-colors duration-200 hover:text-off-white"
      >
        ← Voltar ao início
      </Link>

      <h1 className="font-display text-3xl text-off-white">
        Perguntas frequentes
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-on-pitch-muted">
        Respostas rápidas sobre {APP_NAME} — jogo de futebol online grátis.
      </p>

      <dl className="mt-10 space-y-8">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question}>
            <dt className="font-display text-lg text-off-white">
              {item.question}
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-on-pitch-muted">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 text-sm text-on-pitch-subtle">
        Quer um passo a passo? Leia{" "}
        <Link href="/como-jogar" className="text-gold-light hover:underline">
          como jogar
        </Link>
        .
      </p>
    </main>
  );
}
