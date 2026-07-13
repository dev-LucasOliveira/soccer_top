import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata("Resultado");

export default function SoloGuessResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
