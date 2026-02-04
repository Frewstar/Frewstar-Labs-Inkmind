"use client";

import Link from "next/link";

export type DesignGalleryItem = {
  id: string;
  prompt: string;
  imageUrl: string;
  status: string;
  createdAt: string;
  isPaid?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_deposit: "Pending Deposit",
  confirmed: "Confirmed",
};

export default function DesignGalleryCard({ design }: { design: DesignGalleryItem }) {
  const statusLabel = STATUS_LABELS[design.status] ?? design.status;

  return (
    <div className="design-gallery-card rounded-[var(--radius)] border border-white/10 bg-[var(--bg-card)] overflow-hidden transition hover:border-white/20">
      <div className="aspect-square relative bg-[var(--bg)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={design.imageUrl}
          alt={design.prompt.slice(0, 60)}
          className="w-full h-full object-contain"
        />
        <span
          className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium capitalize"
          style={{
            background: "var(--bg-card)",
            color: "var(--grey)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {statusLabel}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm text-[var(--white)]/90 line-clamp-2 min-h-[2.5rem]" title={design.prompt}>
          {design.prompt}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href={`/?tweak=${design.id}#studio`}
            className="block w-full rounded-[var(--radius)] border border-[var(--gold)]/30 bg-[var(--gold-dim)] py-2 text-center text-sm font-medium text-[var(--gold)] transition hover:border-[var(--gold)] hover:bg-[var(--gold-glow)] hover:text-[var(--white)]"
          >
            Tweak this Design
          </Link>
          {design.isPaid && (
            <a
              href={design.imageUrl}
              download={`design-${design.id}.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-[var(--radius)] border border-white/20 bg-white/5 py-2 text-center text-sm font-medium text-[var(--white)] transition hover:bg-white/10"
            >
              Download High Res
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
