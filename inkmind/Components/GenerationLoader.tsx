"use client";

/**
 * Professional loader shown in the gallery panel while images are generating.
 * Matches app design (dark, gold accents); can take up to ~60s so status messages rotate.
 */
export type GenerationLoaderProps = {
  statusMessage: string;
  count?: number; // 1, 2, or 4 — layout matches result grid
};

export default function GenerationLoader({ statusMessage, count = 4 }: GenerationLoaderProps) {
  const cardCount = Math.min(Math.max(count, 1), 4);
  const gridCols =
    cardCount === 1 ? "1fr" : cardCount === 2 ? "repeat(2, 1fr)" : "repeat(2, 1fr)";

  return (
    <div className="generation-loader">
      <div
        className="generation-loader-grid"
        style={{ gridTemplateColumns: gridCols }}
        aria-hidden
      >
        {Array.from({ length: cardCount }, (_, i) => (
          <div
            key={i}
            className="generation-loader-card"
            aria-hidden
          >
            <div className="generation-loader-card-shimmer" />
            <div className="generation-loader-card-spinner" aria-hidden />
          </div>
        ))}
      </div>
      <p className="generation-loader-status">{statusMessage}</p>
      <p className="generation-loader-hint">This can take up to 60 seconds</p>
    </div>
  );
}
