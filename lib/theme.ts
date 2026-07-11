export type Theme = "light" | "night";

export const THEME_STORAGE_KEY = "theme-preference";

export const DEFAULT_THEME: Theme = "night";

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "night";
}

export const EXPORT_BACKGROUND: Record<Theme, string> = {
  light: "#0c3320",
  night: "#010805",
};

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore quota / private mode
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function toggleTheme(theme: Theme): Theme {
  return theme === "light" ? "night" : "light";
}
