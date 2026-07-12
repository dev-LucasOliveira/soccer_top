import { CreateSessionForm } from "@/components/create-session-form";
import { ModeLandingPage } from "@/components/mode-landing-page";
import { getGameModeConfig } from "@/lib/game-modes";

export default function TradicionalPage() {
  const mode = getGameModeConfig("tradicional");

  return (
    <ModeLandingPage modeId="tradicional">
      <CreateSessionForm
        gameMode={mode.sessionGameMode!}
        submitLabel={mode.submitLabel}
      />
    </ModeLandingPage>
  );
}
