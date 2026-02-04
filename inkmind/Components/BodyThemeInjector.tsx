"use client";

import { useEffect } from "react";

type Props = {
  brandColor: string;
  accentColor: string;
};

/**
 * Injects studio branding CSS variables onto document.body so that
 * var(--brand-color) and var(--accent-color) apply app-wide on tenant routes.
 */
export default function BodyThemeInjector({ brandColor, accentColor }: Props) {
  useEffect(() => {
    const body = document.body;
    if (!body) return;
    body.style.setProperty("--brand-color", brandColor);
    body.style.setProperty("--accent-color", accentColor);
    return () => {
      body.style.removeProperty("--brand-color");
      body.style.removeProperty("--accent-color");
    };
  }, [brandColor, accentColor]);
  return null;
}
