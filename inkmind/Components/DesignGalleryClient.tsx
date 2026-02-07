"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import DesignGalleryCard from "./DesignGalleryCard";
import type { DesignGalleryItem } from "./DesignGalleryCard";
import { toggleFavorite } from "@/app/actions/designs";

export type { DesignGalleryItem };

type DesignGalleryClientProps = {
  designs: DesignGalleryItem[];
  collections?: { id: string; name: string }[];
  unauthenticated?: boolean;
  noAccount?: boolean;
  dbError?: string;
};

const FADE_MS = 300;

export default function DesignGalleryClient({
  designs,
  collections = [],
  unauthenticated = false,
  noAccount = false,
  dbError,
}: DesignGalleryClientProps) {
  const router = useRouter();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleToggleFavorite = useCallback(async (designId: string) => {
    const result = await toggleFavorite(designId);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }, [router]);

  const handleMoveToCollection = useCallback(async (designId: string, collectionId: string) => {
    if (!collectionId) return;
    try {
      const res = await fetch(`/api/designs/${designId}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection_id: collectionId }),
      });
      if (res.ok) router.refresh();
    } catch {
      // ignore
    }
  }, [router]);

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
      <div className="design-gallery-section premium-card p-8 text-center animate-spring-in">
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
      <div className="design-gallery-section premium-card p-8 text-center animate-spring-in">
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
      <div className="design-gallery-section premium-card border-amber-500/20 p-8 text-center animate-spring-in">
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
    <div className="design-gallery-wrapper">
      {/* Gallery Header - Elevated typography and controls */}
      <div className="gallery-header">
        <div className="gallery-header-content">
          <div className="gallery-title-group">
            <h3 className="gallery-title">Your Collection</h3>
            {designs.length > 0 && (
              <div className="gallery-count">
                {filteredDesigns.length} {filteredDesigns.length === 1 ? 'piece' : 'pieces'}
              </div>
            )}
          </div>
          
          {designs.length > 0 && (
            <div className="gallery-controls">
              {/* Favorites Toggle - Luxury Switch */}
              <button
                type="button"
                onClick={handleToggleFavorites}
                disabled={isTransitioning}
                aria-pressed={showFavoritesOnly}
                className={`favorites-toggle ${showFavoritesOnly ? 'active' : ''}`}
              >
                <span className="favorites-icon">
                  {showFavoritesOnly ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/>
                    </svg>
                  )}
                </span>
                <span className="favorites-label">
                  {showFavoritesOnly ? 'Favorites' : 'All Designs'}
                </span>
                {favoritesCount > 0 && (
                  <span className="favorites-badge">{favoritesCount}</span>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Subtle divider */}
        <div className="gallery-divider" />
      </div>

      {/* Gallery Grid - Masonry-style luxury layout */}
      {designs.length === 0 ? (
        <div className="gallery-empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="empty-state-title">No designs yet</p>
          <p className="empty-state-subtitle">
            Start creating in the Design Studio to build your collection
          </p>
        </div>
      ) : filteredDesigns.length === 0 ? (
        <div className="gallery-empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <p className="empty-state-title">No favorites yet</p>
          <p className="empty-state-subtitle">
            Star your favorite designs to see them here
          </p>
        </div>
      ) : (
        <div
          className="gallery-grid"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(8px)' : 'translateY(0)',
          }}
        >
          {filteredDesigns.map((d) => (
            <DesignGalleryCard
              key={d.id}
              design={d}
              collections={collections}
              onToggleFavorite={handleToggleFavorite}
              onMoveToCollection={handleMoveToCollection}
            />
          ))}
        </div>
      )}
    </div>
  );
}
