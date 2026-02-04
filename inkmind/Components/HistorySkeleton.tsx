"use client";

/**
 * High-end shimmer skeleton for the Design History section.
 * Shown while hasMounted is false to prevent layout jump when history loads from localStorage.
 * Matches real history cards: aspect-square, rounded-[10px].
 */
export default function HistorySkeleton() {
  const cardCount = 6;

  return (
    <section className="history-section" aria-hidden>
      <h3 className="section-label">
        <span className="inline-block h-[1em] w-40 rounded bg-white/10 animate-pulse" aria-hidden />
      </h3>
      <p className="saved-hint" style={{ marginTop: 4 }}>
        <span className="inline-block h-3 w-full max-w-md rounded bg-white/5 animate-pulse" aria-hidden />
      </p>
      <div className="history-grid">
        {Array.from({ length: cardCount }, (_, i) => (
          <div
            key={i}
            className="relative aspect-square w-full overflow-hidden rounded-[10px] bg-white/10 border border-white/5"
            aria-hidden
          >
            <div
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent animate-shimmer"
              aria-hidden
            />
          </div>
        ))}
      </div>
    </section>
  );
}
