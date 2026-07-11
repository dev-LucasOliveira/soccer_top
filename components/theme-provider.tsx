"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  applyTheme,
  getStoredTheme,
  setStoredTheme,
  THEME_STORAGE_KEY,
  toggleTheme as flipTheme,
  type Theme,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("night");

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setStoredTheme(next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(flipTheme(theme));
  }, [setTheme, theme]);

  useEffect(() => {
    setTheme(getStoredTheme());

    function handleStorage(event: StorageEvent) {
      if (event.key !== THEME_STORAGE_KEY || !event.newValue) return;
      if (event.newValue === "light" || event.newValue === "night") {
        setThemeState(event.newValue);
        applyTheme(event.newValue);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
