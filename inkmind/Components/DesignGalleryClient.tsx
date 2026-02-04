"use client";

import Link from "next/link";
import DesignGalleryCard from "./DesignGalleryCard";
import type { DesignGalleryItem } from "./DesignGalleryCard";

export type { DesignGalleryItem };

type DesignGalleryClientProps = {
  designs: DesignGalleryItem[];
  unauthenticated?: boolean;
  noAccount?: boolean;
};

export default function DesignGalleryClient({
  designs,
  unauthenticated = false,
  noAccount = false,
}: DesignGalleryClientProps) {
  if (unauthenticated) {
    return (
      <div className="design-gallery-section rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-8 text-center">
        <h3 className="font-[var(--font-head)] text-xl font-semibold text-[var(--white)]">
          My Designs
        </h3>
        <p className="mt-2 text-[var(--grey)]">
          <Link href="/login" className="text-[var(--gold)] hover:underline">
            Sign in
          </Link>{" "}
          to see your saved designs and tweak them.
        </p>
      </div>
    );
  }

  if (noAccount) {
    return (
      <div className="design-gallery-section rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-8 text-center">
        <h3 className="font-[var(--font-head)] text-xl font-semibold text-[var(--white)]">
          My Designs
        </h3>
        <p className="mt-2 text-[var(--grey)]">
          Create an account to save and revisit your designs.
        </p>
      </div>
    );
  }

  return (
    <div className="design-gallery-section">
      <h3 className="section-label mb-4">My Designs</h3>
      {designs.length === 0 ? (
        <p className="text-[var(--grey)]">
          No saved designs yet. Generate something in the Design Studio and save it to see it here.
        </p>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
        >
          {designs.map((d) => (
            <DesignGalleryCard key={d.id} design={d} />
          ))}
        </div>
      )}
    </div>
  );
}
