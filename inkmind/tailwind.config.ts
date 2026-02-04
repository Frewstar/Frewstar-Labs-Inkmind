import type { Config } from "tailwindcss";

/**
 * Theme colors for dynamic studio branding.
 * Actual values come from CSS variables set by studio layout (body style).
 * Use in classes: bg-brand, text-brand, bg-accent, text-accent, etc.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand-color)",
        accent: "var(--accent-color)",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        historyFadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        historyFadeIn: "historyFadeIn 300ms ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
