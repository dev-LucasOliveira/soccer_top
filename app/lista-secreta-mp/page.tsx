import { CreateSessionForm } from "@/components/create-session-form";
import { ModeLandingPage } from "@/components/mode-landing-page";
import { getGameModeConfig } from "@/lib/game-modes";

export default function ListaSecretaMpLandingPage() {
  const mode = getGameModeConfig("lista-secreta-1v1");

  return (
    <ModeLandingPage modeId="lista-secreta-1v1">
      <CreateSessionForm
        gameMode={mode.sessionGameMode!}
        submitLabel={mode.submitLabel}
      />
    </ModeLandingPage>
  );
}
