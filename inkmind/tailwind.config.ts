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
    },
  },
  plugins: [],
};

export default config;
