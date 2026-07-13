import { ModeLandingPage } from "@/components/mode-landing-page";
import { SoloSetupForm } from "@/components/solo-setup-form";
import { getGameModeConfig } from "@/lib/game-modes";
import { buildPageMetadata } from "@/lib/seo";

const mode = getGameModeConfig("ranking");

export const metadata = buildPageMetadata({
  title: "Ranking livre — monte e exporte seu Top N",
  description: `${mode.panelDescription} ${mode.cardDescription}`,
  path: "/ranking",
});

export default function RankingPage() {
  const modeConfig = getGameModeConfig("ranking");

  return (
    <ModeLandingPage
      modeId="ranking"
      backHref="/solo/lobby"
      backLabel="← Voltar ao lobby solo"
    >
      <SoloSetupForm submitLabel={modeConfig.submitLabel} />
    </ModeLandingPage>
  );
}
