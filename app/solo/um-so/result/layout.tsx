import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata("Resultado");

export default function UmSoResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
