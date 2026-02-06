"use client";

import Image from "next/image";

type TattooDesignImageProps = {
  src: string;
  alt: string;
  /** Optional class for the wrapper (e.g. gallery-card-img sizing). */
  className?: string;
  /** Use object-cover for consistent crop; default true. */
  cover?: boolean;
};

/**
 * Renders a tattoo design image (data URL, replicate.delivery, or Supabase).
 * Uses next/image with unoptimized so Replicate’s temporary URLs skip Next.js cache.
 * Wrapper uses aspect-square to prevent layout shift.
 */
export default function TattooDesignImage({
  src,
  alt,
  className = "",
  cover = true,
}: TattooDesignImageProps) {
  return (
    <div className={`relative w-full aspect-square overflow-hidden ${className}`.trim()}>
      <Image
        src={src}
        alt={alt}
        fill
        className={cover ? "object-cover" : "object-contain"}
        unoptimized
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
