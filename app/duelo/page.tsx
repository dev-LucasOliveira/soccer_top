import { CreateSessionForm } from "@/components/create-session-form";
import { ModeLandingPage } from "@/components/mode-landing-page";
import { getGameModeConfig } from "@/lib/game-modes";

export default function DueloLandingPage() {
  const mode = getGameModeConfig("duelo");

  return (
    <ModeLandingPage modeId="duelo">
      <CreateSessionForm
        gameMode={mode.sessionGameMode!}
        submitLabel={mode.submitLabel}
      />
    </ModeLandingPage>
  );
}
