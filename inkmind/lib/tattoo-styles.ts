/**
 * Artist Style Presets: technical keywords injected into the generation prompt
 * so the AI produces style-specific, tattoo-ready designs.
 */
export const TATTOO_STYLES = [
  {
    id: "fine-line",
    label: "Fine Line",
    keywords: "ultra-thin needles, elegant, minimal shading, crisp edges",
    icon: "✦",
  },
  {
    id: "traditional",
    label: "Traditional",
    keywords: "bold outlines, limited color palette, iconic imagery, vintage feel",
    icon: "⊕",
  },
  {
    id: "blackwork",
    label: "Blackwork",
    keywords: "heavy black ink, high contrast, geometric patterns, no gray",
    icon: "⟡",
  },
  {
    id: "micro-realism",
    label: "Micro-Realism",
    keywords: "hyper-detailed, photographic, soft shading, tiny scale",
    icon: "◉",
  },
] as const;

export type TattooStyleId = (typeof TATTOO_STYLES)[number]["id"];

export function getStyleById(id: string): (typeof TATTOO_STYLES)[number] | undefined {
  return TATTOO_STYLES.find((s) => s.id === id);
}

export function getStyleKeywords(id: string): string | null {
  const style = getStyleById(id);
  return style?.keywords ?? null;
}
