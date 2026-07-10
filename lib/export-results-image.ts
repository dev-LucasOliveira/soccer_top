import { toPng } from "html-to-image";

export function slugifyTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function downloadResultsImage(
  element: HTMLElement,
  { title, code }: { title: string; code: string }
): Promise<void> {
  const dataUrl = await toPng(element, {
    backgroundColor: "#0f3d22",
    pixelRatio: 2,
    cacheBust: true,
  });

  const slug = slugifyTitle(title);
  const filename = slug
    ? `ranking-da-resenha-${code}-${slug}.png`
    : `ranking-da-resenha-${code}-resultados.png`;

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
