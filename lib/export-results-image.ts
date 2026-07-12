import { toBlob } from "html-to-image";
import {
  deliverImageBlob,
  getExportPixelRatio,
  type ExportImageResult,
} from "@/lib/deliver-image-download";
import {
  EXPORT_BACKGROUND,
  getStoredTheme,
  isTheme,
  type Theme,
} from "@/lib/theme";

export function slugifyTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function resolveExportTheme(theme?: Theme): Theme {
  const domTheme = document.documentElement.dataset.theme;
  if (isTheme(domTheme)) return domTheme;
  if (theme) return theme;
  return getStoredTheme();
}

type StylePatch = Partial<
  Record<
    | "backgroundColor"
    | "backgroundImage"
    | "borderColor"
    | "border"
    | "color"
    | "boxShadow",
    string
  >
>;

function paint(
  snapshots: Map<HTMLElement, string>,
  element: HTMLElement,
  patch: StylePatch
) {
  if (!snapshots.has(element)) {
    snapshots.set(element, element.style.cssText);
  }

  Object.assign(element.style, patch);
}

function applyExportThemeStyles(
  root: HTMLElement,
  theme: Theme
): () => void {
  const snapshots = new Map<HTMLElement, string>();

  paint(snapshots, root, {
    backgroundColor: EXPORT_BACKGROUND[theme],
    backgroundImage: "none",
  });

  if (theme !== "night") {
    return () => {
      snapshots.forEach((cssText, element) => {
        element.style.cssText = cssText;
      });
    };
  }

  const selectors: Array<[string, StylePatch]> = [
    [
      ".card-football",
      {
        backgroundColor: "#1a1814",
        borderColor: "rgba(197, 162, 93, 0.38)",
        color: "#f5efe4",
      },
    ],
    [".card-pitch-header", { backgroundColor: "#0f1f17", backgroundImage: "none", color: "#ede6d6" }],
    [
      ".rank-badge-card",
      {
        backgroundColor: "#0f1f17",
        backgroundImage: "none",
        color: "#ede6d6",
        border: "none",
        boxShadow: "none",
      },
    ],
    [
      ".gold-chip",
      {
        backgroundImage: "linear-gradient(to bottom, #e8d4a8, #c5a25d)",
        backgroundColor: "#c5a25d",
        color: "#2c2418",
        border: "1px solid rgba(168, 134, 66, 0.35)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
      },
    ],
    [".text-foreground", { color: "#f5efe4" }],
    [".text-text-muted", { color: "#c4b8a8" }],
    [".text-on-pitch-subtle", { color: "rgba(237, 230, 214, 0.72)" }],
  ];

  for (const [selector, patch] of selectors) {
    root.querySelectorAll(selector).forEach((node) => {
      paint(snapshots, node as HTMLElement, patch);
    });
  }

  root.querySelectorAll('[class*="bg-off-white-muted"]').forEach((node) => {
    paint(snapshots, node as HTMLElement, { backgroundColor: "#353024" });
  });

  root.querySelectorAll('[class*="bg-gold/"]').forEach((node) => {
    paint(snapshots, node as HTMLElement, {
      backgroundColor: "rgba(197, 162, 93, 0.12)",
      borderColor: "rgba(197, 162, 93, 0.3)",
    });
  });

  root.querySelectorAll('[class*="border-card-border"]').forEach((node) => {
    paint(snapshots, node as HTMLElement, {
      borderColor: "rgba(197, 162, 93, 0.38)",
    });
  });

  return () => {
    snapshots.forEach((cssText, element) => {
      element.style.cssText = cssText;
    });
  };
}

async function captureElementAsBlob(
  element: HTMLElement,
  theme?: Theme
): Promise<Blob> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const resolvedTheme = resolveExportTheme(theme);
  const restoreStyles = applyExportThemeStyles(element, resolvedTheme);

  try {
    const blob = await toBlob(element, {
      backgroundColor: EXPORT_BACKGROUND[resolvedTheme],
      pixelRatio: getExportPixelRatio(),
      cacheBust: true,
    });

    if (!blob) {
      throw new Error("Falha ao gerar imagem");
    }

    return blob;
  } finally {
    restoreStyles();
  }
}

export async function downloadResultsImage(
  element: HTMLElement,
  {
    title,
    code,
    theme,
  }: { title: string; code: string; theme?: Theme }
): Promise<ExportImageResult> {
  const blob = await captureElementAsBlob(element, theme);

  const slug = slugifyTitle(title);
  const filename = slug
    ? `ranking-da-resenha-${code}-${slug}-resultado-completo.png`
    : `ranking-da-resenha-${code}-resultado-completo.png`;

  return deliverImageBlob(blob, filename);
}

export async function downloadSoloRankingImage(
  element: HTMLElement,
  {
    title,
    authorName,
    theme,
  }: { title: string; authorName: string; theme?: Theme }
): Promise<ExportImageResult> {
  const blob = await captureElementAsBlob(element, theme);

  const titleSlug = slugifyTitle(title);
  const authorSlug = slugifyTitle(authorName);
  const filename =
    titleSlug && authorSlug
      ? `ranking-da-resenha-${authorSlug}-${titleSlug}.png`
      : titleSlug
        ? `ranking-da-resenha-${titleSlug}.png`
        : "ranking-da-resenha-solo.png";

  return deliverImageBlob(blob, filename);
}

export async function downloadGuessTopRecapImage(
  element: HTMLElement,
  {
    tops,
    errors,
    theme,
  }: { tops: number; errors: number; theme?: Theme }
): Promise<ExportImageResult> {
  const blob = await captureElementAsBlob(element, theme);
  const filename = `ranking-da-resenha-lista-secreta-${tops}tops-${errors}erros.png`;
  return deliverImageBlob(blob, filename);
}

export async function downloadUmSoRecapImage(
  element: HTMLElement,
  {
    score,
    bestStreak,
    theme,
  }: { score: number; bestStreak: number; theme?: Theme }
): Promise<ExportImageResult> {
  const blob = await captureElementAsBlob(element, theme);
  const filename = `ranking-da-resenha-um-so-${score}pts-streak${bestStreak}.png`;
  return deliverImageBlob(blob, filename);
}

export async function downloadDueloRecapImage(
  element: HTMLElement,
  {
    winnerName,
    winnerPoints,
    theme,
  }: { winnerName: string; winnerPoints: number; theme?: Theme }
): Promise<ExportImageResult> {
  const blob = await captureElementAsBlob(element, theme);
  const slug = slugifyTitle(winnerName);
  const filename = `ranking-da-resenha-duelo-${slug}-${winnerPoints}pts.png`;
  return deliverImageBlob(blob, filename);
}
