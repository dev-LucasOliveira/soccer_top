import { ModeLandingPage } from "@/components/mode-landing-page";
import { SoloUmSoHub } from "@/components/solo-um-so-hub";

export default function UmSoPage() {
  return (
    <ModeLandingPage modeId="um-so" showRules={false} backHref="/solo/lobby" backLabel="← Voltar ao lobby solo">
      <SoloUmSoHub />
    </ModeLandingPage>
  );
}
