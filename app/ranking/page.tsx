import { ModeLandingPage } from "@/components/mode-landing-page";
import { SoloSetupForm } from "@/components/solo-setup-form";
import { getGameModeConfig } from "@/lib/game-modes";

export default function RankingPage() {
  const mode = getGameModeConfig("ranking");

  return (
    <ModeLandingPage modeId="ranking">
      <SoloSetupForm submitLabel={mode.submitLabel} />
    </ModeLandingPage>
  );
}
