import { CreateSessionForm } from "@/components/create-session-form";
import { ModeLandingPage } from "@/components/mode-landing-page";
import { getGameModeConfig } from "@/lib/game-modes";

export default function ImpostorPage() {
  const mode = getGameModeConfig("impostor");

  return (
    <ModeLandingPage modeId="impostor">
      <CreateSessionForm
        gameMode={mode.sessionGameMode!}
        submitLabel={mode.submitLabel}
      />
    </ModeLandingPage>
  );
}
