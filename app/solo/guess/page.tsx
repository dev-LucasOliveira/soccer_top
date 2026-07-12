import { ModeLandingPage } from "@/components/mode-landing-page";
import { SoloGuessHub } from "@/components/solo-guess-hub";

export default function SoloGuessPage() {
  return (
    <ModeLandingPage modeId="lista-secreta" showRules={false}>
      <SoloGuessHub />
    </ModeLandingPage>
  );
}
