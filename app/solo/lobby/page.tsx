import { SoloLobby } from "@/components/solo-lobby";
import { buildPageMetadata } from "@/lib/seo";
import { APP_NAME } from "@/lib/branding";

export const metadata = buildPageMetadata({
  title: "Lobby solo — modos para jogar sozinho",
  description: `Escolha Lista Secreta, Um Só ou Ranking livre nos modos solo do ${APP_NAME}.`,
  path: "/solo/lobby",
});

export default function SoloLobbyPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <SoloLobby />
    </main>
  );
}
