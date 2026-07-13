import { ModeLandingPage } from "@/components/mode-landing-page";
import { SoloSetupForm } from "@/components/solo-setup-form";
import { getGameModeConfig } from "@/lib/game-modes";

export default function RankingPage() {
  const mode = getGameModeConfig("ranking");

  return (
    <ModeLandingPage
      modeId="ranking"
      backHref="/solo/lobby"
      backLabel="← Voltar ao lobby solo"
    >
      <SoloSetupForm submitLabel={mode.submitLabel} />
    </ModeLandingPage>
  );
}
