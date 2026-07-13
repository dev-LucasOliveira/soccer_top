const SOLO_DISPLAY_NAME_KEY = "soloDisplayName";

export function getSoloDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SOLO_DISPLAY_NAME_KEY);
}

export function setSoloDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOLO_DISPLAY_NAME_KEY, name.trim());
}
