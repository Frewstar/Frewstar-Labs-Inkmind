"use client";

import Link from "next/link";
import { useState, useMemo, useCallback } from "react";
import DesignGalleryCard from "./DesignGalleryCard";
import type { DesignGalleryItem } from "./DesignGalleryCard";

export type { DesignGalleryItem };

type DesignGalleryClientProps = {
  designs: DesignGalleryItem[];
  unauthenticated?: boolean;
  noAccount?: boolean;
  dbError?: string;
};

const FADE_MS = 200;

export default function DesignGalleryClient({
  designs,
  unauthenticated = false,
  noAccount = false,
  dbError,
}: DesignGalleryClientProps) {
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const favoritesCount = useMemo(
    () => designs.filter((d) => d.isStarred).length,
    [designs]
  );

  const filteredDesigns = useMemo(
    () => (showFavoritesOnly ? designs.filter((d) => d.isStarred) : designs),
    [designs, showFavoritesOnly]
  );

  const handleToggleFavorites = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setShowFavoritesOnly((v) => !v);
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }, FADE_MS);
  }, [isTransitioning]);
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

  if (dbError) {
    return (
      <div className="design-gallery-section rounded-[var(--radius-lg)] border border-amber-500/30 bg-[var(--bg-card)] p-8 text-center">
        <h3 className="font-[var(--font-head)] text-xl font-semibold text-[var(--white)]">
          My Designs
        </h3>
        <p className="mt-2 text-[var(--grey)]">{dbError}</p>
        <p className="mt-2 text-sm text-[var(--grey)]">
          Check your <code className="rounded bg-white/10 px-1">.env.local</code>{" "}
          <code className="rounded bg-white/10 px-1">DATABASE_URL</code> and
          that your Supabase project is running.
        </p>
      </div>
    );
  }

  return (
    <div className="design-gallery-section">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="section-label m-0">My Designs</h3>
        {designs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleToggleFavorites}
              disabled={isTransitioning}
              aria-pressed={showFavoritesOnly}
              className={`min-h-[var(--touch-min)] rounded-[var(--radius)] border px-4 py-2 text-sm font-medium transition disabled:opacity-70 ${
                showFavoritesOnly
                  ? "border-[var(--gold)]/50 bg-[var(--gold-dim)] text-[var(--gold)] hover:bg-[var(--gold-glow)] hover:text-[var(--white)]"
                  : "border-white/15 bg-white/5 text-[var(--white)] hover:bg-white/10"
              }`}
            >
              Filter by Favorites
            </button>
            <span className="text-sm text-[var(--grey)]">
              Favorites ({favoritesCount})
            </span>
          </div>
        )}
      </div>
      {designs.length === 0 ? (
        <p className="text-[var(--grey)]">
          No saved designs yet. Generate something in the Design Studio and save it to see it here.
        </p>
      ) : filteredDesigns.length === 0 ? (
        <p className="text-[var(--grey)]">
          No starred designs. Star some designs to see them here.
        </p>
      ) : (
        <div
          className="grid gap-4 opacity-100 transition-opacity duration-200 ease-out sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            opacity: isTransitioning ? 0 : 1,
          }}
        >
          {filteredDesigns.map((d) => (
            <DesignGalleryCard key={d.id} design={d} />
          ))}
        </div>
      )}
    </div>
  );
}
