"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Design = {
  id: string;
  prompt: string;
  imageUrl: string;
  status: string;
  createdAt: string;
  studioName: string;
  studioSlug: string | null;
};

type DesignGalleryProps = {
  designs: Design[];
};

export default function DesignGallery({ designs }: DesignGalleryProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const filteredDesigns = designs.filter((d) => {
    if (filter === "all") return true;
    if (filter === "pending") return d.status === "pending";
    if (filter === "approved") return d.status === "approved";
    return true;
  });

  const pendingCount = designs.filter((d) => d.status === "pending").length;
  const approvedCount = designs.filter((d) => d.status === "approved").length;

  return (
    <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] overflow-hidden">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-5 py-4 border-b border-white/10">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-[var(--radius)] text-xs font-medium transition ${
            filter === "all"
              ? "bg-[var(--gold-dim)] text-[var(--gold)]"
              : "text-[var(--grey)] hover:text-[var(--white)]"
          }`}
        >
          All ({designs.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 rounded-[var(--radius)] text-xs font-medium transition ${
            filter === "pending"
              ? "bg-amber-500/20 text-amber-400"
              : "text-[var(--grey)] hover:text-[var(--white)]"
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("approved")}
          className={`px-4 py-2 rounded-[var(--radius)] text-xs font-medium transition ${
            filter === "approved"
              ? "bg-emerald-500/20 text-emerald-400"
              : "text-[var(--grey)] hover:text-[var(--white)]"
          }`}
        >
          Approved ({approvedCount})
        </button>
      </div>

      {/* Gallery Grid */}
      {filteredDesigns.length === 0 ? (
        <div className="p-12 text-center text-[var(--grey)] text-sm">
          No designs found for this filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-5">
          {filteredDesigns.map((design) => (
            <div
              key={design.id}
              className="group relative rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg)] overflow-hidden hover:border-[var(--gold)]/30 transition-all duration-300"
            >
              {/* Image */}
              <div className="aspect-square relative bg-black/40">
                {design.imageUrl ? (
                  <Image
                    src={design.imageUrl}
                    alt={design.prompt}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[var(--grey)]">
                    No image
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded-[var(--radius)] text-[10px] font-semibold backdrop-blur-sm capitalize ${
                      design.status === "approved"
                        ? "bg-emerald-500/80 text-white"
                        : "bg-amber-500/80 text-white"
                    }`}
                  >
                    {design.status}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <p className="text-xs text-[var(--white)]/90 line-clamp-2">
                  {design.prompt}
                </p>

                {design.studioSlug && (
                  <Link
                    href={`/${design.studioSlug}`}
                    className="text-[10px] text-[var(--gold)] hover:underline"
                  >
                    {design.studioName}
                  </Link>
                )}

                <p className="text-[10px] text-[var(--grey)]">
                  {new Date(design.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
