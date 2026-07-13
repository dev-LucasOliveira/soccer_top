import { buildNoIndexMetadata } from "@/lib/seo";
import { SessionVoiceShell } from "@/components/session-voice-shell";

export const metadata = buildNoIndexMetadata("Sala");

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionVoiceShell>{children}</SessionVoiceShell>;
}
