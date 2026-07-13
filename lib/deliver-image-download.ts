import { APP_NAME } from "@/lib/branding";

export type ExportImageResult =
  | { status: "downloaded" }
  | { status: "shared" }
  | { status: "preview"; objectUrl: string; filename: string; blob: Blob };

function isMobileDevice(): boolean {
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

export function getExportPixelRatio(): number {
  if (isMobileDevice()) return 1;
  return Math.min(window.devicePixelRatio, 2);
}

export async function deliverImageBlob(
  blob: Blob,
  filename: string
): Promise<ExportImageResult> {
  if (isMobileDevice()) {
    return {
      status: "preview",
      objectUrl: URL.createObjectURL(blob),
      filename,
      blob,
    };
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { status: "downloaded" };
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  }
}

export async function shareImageBlob(blob: Blob, filename: string): Promise<boolean> {
  const file = new File([blob], filename, { type: "image/png" });

  if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
    return false;
  }

  try {
    await navigator.share({
      files: [file],
      title: APP_NAME,
    });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false;
    }
    throw error;
  }
}

export function revokePreviewUrl(objectUrl: string): void {
  URL.revokeObjectURL(objectUrl);
}
