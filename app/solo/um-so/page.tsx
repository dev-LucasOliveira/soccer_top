import { ModeLandingPage } from "@/components/mode-landing-page";
import { SoloUmSoHub } from "@/components/solo-um-so-hub";
import { buildPageMetadata } from "@/lib/seo";
import { getGameModeConfig } from "@/lib/game-modes";

const mode = getGameModeConfig("um-so");

export const metadata = buildPageMetadata({
  title: "Um Só — adivinhe o jogador misterioso",
  description: `${mode.panelDescription} ${mode.cardDescription}`,
  path: "/solo/um-so",
});

export default function UmSoPage() {
  return (
    <ModeLandingPage modeId="um-so" showRules={false} backHref="/solo/lobby" backLabel="← Voltar ao lobby solo">
      <SoloUmSoHub />
    </ModeLandingPage>
  );
}
