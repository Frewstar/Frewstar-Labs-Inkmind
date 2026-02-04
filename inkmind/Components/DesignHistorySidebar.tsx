"use client";

import Link from "next/link";

export type DesignHistoryEntry = {
  id: string;
  image_url: string | null;
  prompt: string | null;
  created_at: Date | string;
  isCurrent?: boolean;
};

type DesignHistorySidebarProps = {
  /** Full chain: [oldest, ..., parent, current]. Current is last. */
  history: DesignHistoryEntry[];
  designId: string;
  className?: string;
};

function formatDate(d: Date | string): string {
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export default function DesignHistorySidebar({
  history,
  designId,
  className = "",
}: DesignHistorySidebarProps) {
  if (history.length <= 1) return null;

  return (
    <div className={`design-history-sidebar ${className}`}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--grey)] mb-3">
        Evolution
      </h3>
      <div className="relative flex flex-col">
        {/* Vertical tree line */}
        <div
          className="absolute left-7 top-6 bottom-6 w-px bg-white/20"
          style={{ height: Math.max(0, history.length * 72 - 24) }}
          aria-hidden
        />
        {history.map((entry, index) => {
          const isCurrent = entry.id === designId;
          const hasImage = !!entry.image_url;
          return (
            <div key={entry.id} className="relative flex items-start gap-3 py-2 first:pt-0">
              <div
                className={`relative rounded-lg overflow-hidden border-2 shrink-0 z-[1] ${
                  isCurrent
                    ? "border-[var(--gold)] ring-2 ring-[var(--gold)]/30"
                    : "border-white/20 hover:border-[var(--gold)]/50"
                }`}
                style={{ width: 56, height: 56 }}
              >
                {hasImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.image_url!}
                      alt=""
                      className="w-full h-full object-cover"
                      width={56}
                      height={56}
                    />
                    {isCurrent && (
                      <span className="absolute bottom-0 left-0 right-0 bg-[var(--gold)]/90 text-[var(--bg)] text-[10px] font-medium text-center py-0.5">
                        Current
                      </span>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-[var(--grey)] text-xs">
                    —
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs text-[var(--grey)] truncate" title={entry.prompt ?? ""}>
                  {entry.prompt ? `${entry.prompt.slice(0, 32)}${entry.prompt.length > 32 ? "…" : ""}` : "—"}
                </p>
                <p className="text-[10px] text-[var(--grey)]/80 mt-0.5">{formatDate(entry.created_at)}</p>
                {!isCurrent && hasImage && (
                  <Link
                    href={`/?parent_id=${encodeURIComponent(entry.id)}`}
                    className="inline-block mt-1.5 text-xs font-medium text-[var(--gold)] hover:text-[var(--gold)]/80 underline underline-offset-2"
                  >
                    Branch off from here
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
