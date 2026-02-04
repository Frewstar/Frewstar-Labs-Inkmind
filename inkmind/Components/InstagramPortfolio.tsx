"use client";

import { useState, useEffect } from "react";
import ImageLightbox from "./ImageLightbox";
import { getFirstTattooPhotos, getRandomTattooPhotos } from "@/lib/tattoo-photos";

/**
 * InstagramPortfolio — Client Component
 * Displays 6 random tattoo photos from the pool. Refreshes every 60 seconds.
 * Click any image to enlarge in lightbox.
 */
export default function InstagramPortfolio() {
  const [photos, setPhotos] = useState<string[]>(() => getFirstTattooPhotos(6));
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const refreshPhotos = () => {
    setPhotos(getRandomTattooPhotos(6));
  };

  useEffect(() => {
    setPhotos(getRandomTattooPhotos(6));
    const interval = setInterval(refreshPhotos, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section>
      <div className="section-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <h2
            className="section-title"
            style={{ fontFamily: "var(--font-head)", marginBottom: 0 }}
          >
            Latest from the Studio
          </h2>
          <button
            type="button"
            onClick={refreshPhotos}
            className="btn-outline"
            style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
          >
            Show different photos
          </button>
        </div>
        <div className="instagram-grid">
          {photos.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              className="instagram-card"
              onClick={() => setLightboxImage(url)}
              style={{ border: "none", padding: 0, background: "none", cursor: "pointer" }}
            >
              <img
                src={url}
                alt="Portfolio tattoo design"
                className="instagram-card-img"
              />
              <span className="instagram-card-hover" aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <ImageLightbox
        src={lightboxImage}
        alt="Portfolio tattoo design"
        onClose={() => setLightboxImage(null)}
      />
    </section>
  );
}
