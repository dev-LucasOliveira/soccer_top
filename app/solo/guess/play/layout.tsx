import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata("Jogando");

export default function SoloGuessPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
