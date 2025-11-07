"use client";

import { useTheme } from "@/providers/ThemeProvider";
import { SunIcon, MoonIcon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 sm:p-2 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
      style={{
        backgroundColor: "transparent",
        color: "var(--foreground)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--muted)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      {theme === "light" ? (
        <SunIcon className="w-5 h-5 sm:w-5 sm:h-5" />
      ) : (
        <MoonIcon className="w-5 h-5 sm:w-5 sm:h-5" />
      )}
    </button>
  );
}
