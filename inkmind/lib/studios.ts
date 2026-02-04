/**
 * Studio tenant settings — mock data; replace with DB/API later.
 * Used by app/studios/[subdomain]/layout.tsx for dynamic branding.
 */
export type StudioSettings = {
  subdomain: string;
  name: string;
  logoUrl: string;
  brandColor: string;
  accentColor: string;
};

const MOCK_STUDIOS: Record<string, StudioSettings> = {
  blacksector: {
    subdomain: "blacksector",
    name: "Black Sector Tattoo Studio",
    logoUrl: "/Logo/black-sector-tattoo-studio.png",
    brandColor: "#00F0FF",
    accentColor: "#CCCCCC",
  },
  inkmind: {
    subdomain: "inkmind",
    name: "InkMind",
    logoUrl: "/Logo/black-sector-tattoo-studio.png",
    brandColor: "#E8B45A",
    accentColor: "#999999",
  },
};

const DEFAULT_STUDIO: StudioSettings = {
  subdomain: "default",
  name: "Frewstar Labs",
  logoUrl: "/Logo/black-sector-tattoo-studio.png",
  brandColor: "#E8B45A",
  accentColor: "#CCCCCC",
};

export function getStudioBySubdomain(subdomain: string): StudioSettings {
  const key = subdomain.toLowerCase();
  return MOCK_STUDIOS[key] ?? { ...DEFAULT_STUDIO, subdomain: key, name: key };
}
