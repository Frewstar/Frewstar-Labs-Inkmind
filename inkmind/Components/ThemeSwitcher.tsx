"use client";

import { useEffect, useState } from "react";

export type ThemeId = "classic-gold" | "black-sector" | "cyberpunk-neon" | null;

const THEMES: { id: ThemeId; label: string }[] = [
  { id: "classic-gold", label: "Classic Gold" },
  { id: "black-sector", label: "Black Sector Chrome" },
  { id: "cyberpunk-neon", label: "Cyberpunk Neon" },
];

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    const html = document.documentElement;
    if (theme) {
      html.setAttribute("data-theme", theme);
    } else {
      html.removeAttribute("data-theme");
    }
  }, [theme, mounted]);

  if (!mounted) return null;

  return (
    <div
      className="theme-switcher"
      role="group"
      aria-label="Demo theme"
    >
      <span className="theme-switcher-label">Theme</span>
      <div className="theme-switcher-btns">
        {THEMES.map(({ id, label }) => (
          <button
            key={id ?? "default"}
            type="button"
            onClick={() => setTheme(theme === id ? null : id)}
            className={`theme-switcher-btn ${theme === id ? "active" : ""}`}
            aria-pressed={theme === id}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
