"use client";

import DesignStudio from "@/components/DesignStudio";

type Props = { studioSlug: string };

/** Renders the Creator (DesignStudio) scoped to this studio so generations save to it. */
export default function StudioCreatorSlot({ studioSlug }: Props) {
  return (
    <section id="studio" className="studio">
      <div className="section-inner">
        <p className="section-label">Design Studio</p>
        <h2 className="section-title">
          Describe what you want. Edit with the strength slider.
        </h2>
        <DesignStudio studioSlug={studioSlug} />
      </div>
    </section>
  );
}
