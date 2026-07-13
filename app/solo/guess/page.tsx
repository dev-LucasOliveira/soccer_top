import { ModeLandingPage } from "@/components/mode-landing-page";
import { SoloGuessHub } from "@/components/solo-guess-hub";
import { buildPageMetadata } from "@/lib/seo";
import { getGameModeConfig } from "@/lib/game-modes";

const mode = getGameModeConfig("lista-secreta");

export const metadata = buildPageMetadata({
  title: "Lista Secreta — adivinhe jogadores de futebol",
  description: `${mode.panelDescription} ${mode.cardDescription}`,
  path: "/solo/guess",
});

export default function SoloGuessPage() {
  return (
    <ModeLandingPage modeId="lista-secreta" showRules={false} backHref="/solo/lobby" backLabel="← Voltar ao lobby solo">
      <SoloGuessHub />
    </ModeLandingPage>
  );
}
