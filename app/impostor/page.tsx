import Link from "next/link";
import { ModeLandingPage } from "@/components/mode-landing-page";
import { ModeLandingSeo } from "@/components/seo/mode-landing-seo";
import { buildModeLandingMetadata } from "@/lib/seo";

export const metadata = buildModeLandingMetadata("impostor");

export default function ImpostorPage() {
  return (
    <>
      <ModeLandingPage modeId="impostor">
        <div className="space-y-4 text-center">
          <p className="text-sm text-on-pitch-muted">
            Reúna pelo menos 4 jogadores e descubra quem está blefando.
          </p>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-gold-light to-gold px-6 py-3.5 text-base font-semibold text-gold-foreground shadow-sm transition-all duration-200 hover:from-gold hover:to-gold-dark"
          >
            Criar sala grátis
          </Link>
        </div>
      </ModeLandingPage>
      <ModeLandingSeo modeId="impostor" />
    </>
  );
}
