import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata = buildNoIndexMetadata("Jogando");

export default function UmSoPlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
