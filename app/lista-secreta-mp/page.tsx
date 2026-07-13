import Link from "next/link";
import { ModeLandingPage } from "@/components/mode-landing-page";
import { ModeLandingSeo } from "@/components/seo/mode-landing-seo";
import { buildModeLandingMetadata } from "@/lib/seo";

export const metadata = buildModeLandingMetadata("lista-secreta-1v1");

export default function ListaSecretaMpPage() {
  return (
    <>
      <ModeLandingPage modeId="lista-secreta-1v1">
        <div className="space-y-4 text-center">
          <p className="text-sm text-on-pitch-muted">
            Dois jogadores, mesma lista secreta — quem revelar mais ganha.
          </p>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-gold-light to-gold px-6 py-3.5 text-base font-semibold text-gold-foreground shadow-sm transition-all duration-200 hover:from-gold hover:to-gold-dark"
          >
            Criar sala grátis
          </Link>
        </div>
      </ModeLandingPage>
      <ModeLandingSeo modeId="lista-secreta-1v1" />
    </>
  );
}
