"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isNight = theme === "night";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isNight ? "Ativar modo claro" : "Ativar modo noturno"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-pitch-muted transition-colors duration-200 hover:bg-off-white/10 hover:text-off-white"
    >
      {isNight ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
