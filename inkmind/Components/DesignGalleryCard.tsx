"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Clipboard, Check, Share2, Star } from "lucide-react";
import { deleteMyDesign, toggleFavorite } from "@/app/actions/designs";

const PROMPT_TRUNCATE_LEN = 80;

export type DesignGalleryItem = {
  id: string;
  prompt: string;
  imageUrl: string;
  referenceImageUrl?: string | null;
  status: string;
  isStarred?: boolean;
  collectionId?: string | null;
  createdAt: string;
  isPaid?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending",
  pending_deposit: "Pending Deposit",
  confirmed: "Confirmed",
};

/** Fixed locale so server and client render the same string (avoids hydration mismatch). */
function formatGeneratedDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

type DesignGalleryCardProps = {
  design: DesignGalleryItem;
  collections?: { id: string; name: string }[];
  onToggleFavorite?: (designId: string) => void | Promise<void>;
  onMoveToCollection?: (designId: string, collectionId: string) => void | Promise<void>;
};

export default function DesignGalleryCard({
  design,
  collections = [],
  onToggleFavorite: onToggleFavoriteProp,
  onMoveToCollection: onMoveToCollectionProp,
}: DesignGalleryCardProps) {
  const router = useRouter();
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [showReference, setShowReference] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<"shared" | "copied" | null>(null);
  const [starred, setStarred] = useState(design.isStarred ?? false);
  const [imageError, setImageError] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStarred(design.isStarred ?? false);
  }, [design.isStarred]);

  const statusLabel = STATUS_LABELS[design.status] ?? design.status;
  const promptLong = design.prompt.length > PROMPT_TRUNCATE_LEN;
  const promptDisplay = promptExpanded || !promptLong
    ? design.prompt
    : `${design.prompt.slice(0, PROMPT_TRUNCATE_LEN).trim()}…`;

  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(design.prompt);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch {
      // clipboard not available (e.g. non-HTTPS)
    }
  }

  function clearShareFeedback() {
    setShareFeedback(null);
    shareTimeoutRef.current = null;
  }

  async function handleShare() {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${design.id}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          url,
          title: "InkMind design",
          text: design.prompt?.slice(0, 100) ?? "Check out this tattoo design",
        });
        setShareFeedback("shared");
        if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
        shareTimeoutRef.current = setTimeout(clearShareFeedback, 2000);
      } else {
        await navigator.clipboard.writeText(url);
        setShareFeedback("copied");
        if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
        shareTimeoutRef.current = setTimeout(clearShareFeedback, 2000);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          setShareFeedback("copied");
          if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current);
          shareTimeoutRef.current = setTimeout(clearShareFeedback, 2000);
        } catch {
          alert("Could not copy link");
        }
      }
    }
  }

  async function handleToggleFavorite() {
    if (onToggleFavoriteProp) {
      await onToggleFavoriteProp(design.id);
      return;
    }
    const result = await toggleFavorite(design.id);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.isStarred !== undefined) setStarred(result.isStarred);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this design? This cannot be undone.")) return;
    setDeleting(true);
    const result = await deleteMyDesign(design.id);
    setDeleting(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="design-gallery-card premium-card overflow-hidden hover-scale press-scale">
      <div className="aspect-square relative bg-[var(--bg)]">
        {showReference && design.referenceImageUrl && (
          <div
            className="absolute inset-0 z-10 flex items-stretch gap-1 bg-[var(--bg)]/95 p-1"
            role="dialog"
            aria-label="Reference and result"
          >
            <div className="flex-1 flex flex-col items-center justify-center min-w-0">
              <span className="text-[10px] uppercase text-[var(--grey)] mb-1">Inspired by</span>
              <div className="relative w-full aspect-square max-h-full">
                <Image
                  src={design.referenceImageUrl}
                  alt="Reference"
                  fill
                  className="object-contain rounded-[var(--radius)] border border-white/10"
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 200px"
                />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center min-w-0 relative">
              <span className="text-[10px] uppercase text-[var(--grey)] mb-1">Result</span>
              <div className="tattoo-watermark-wrap max-w-full max-h-full relative aspect-square w-full">
                {design.imageUrl ? (
                  <Image
                    src={design.imageUrl}
                    alt=""
                    fill
                    className="object-contain rounded-[var(--radius)] border border-white/10"
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)] text-[var(--grey)] text-xs rounded-[var(--radius)]">No image</div>
                )}
                <span className="tattoo-watermark" aria-hidden>InkMind</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReference(false)}
              className="absolute top-1 right-1 rounded-full bg-[var(--bg-card)]/90 p-1.5 text-[var(--grey)] hover:text-[var(--white)]"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className="tattoo-watermark-wrap absolute inset-0 flex items-center justify-center">
          {design.imageUrl && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={design.imageUrl}
              alt={design.prompt.slice(0, 60)}
              className="absolute inset-0 w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg)] text-[var(--grey)] text-sm" aria-hidden>
              No image
            </div>
          )}
          <span className="tattoo-watermark" aria-hidden>InkMind</span>
        </div>
        <span className="absolute top-2 right-11 badge-premium badge-premium-gold capitalize">
          {statusLabel}
        </span>
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-card)]/90 text-[var(--grey)] transition hover:bg-[var(--bg-card)] hover:text-[var(--gold)]"
          aria-label={starred ? "Unstar" : "Star"}
          title={starred ? "Unstar" : "Star"}
        >
          <Star
            className="h-5 w-5"
            fill={starred ? "var(--gold)" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
          />
        </button>
        {design.referenceImageUrl && !showReference && (
          <button
            type="button"
            onClick={() => setShowReference(true)}
            className="absolute bottom-2 left-2 rounded-[var(--radius)] bg-[var(--bg-card)]/90 px-2 py-1 text-[10px] font-medium text-[var(--gold)] border border-[var(--gold)]/30 hover:bg-[var(--gold-dim)] hover:text-[var(--white)]"
            title="View reference photo"
          >
            Inspired by
          </button>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-[var(--grey)] mb-1">
          Generated on {formatGeneratedDate(design.createdAt)}
        </p>
        <p className="text-sm text-[var(--white)]/90 min-h-[2.5rem]" title={design.prompt}>
          {promptDisplay}
          {promptLong && !promptExpanded && (
            <button
              type="button"
              onClick={() => setPromptExpanded(true)}
              className="ml-1 text-[var(--gold)] hover:underline"
            >
              Read more
            </button>
          )}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="btn-premium-secondary flex min-h-[var(--touch-min)] items-center justify-center gap-2 py-2.5 w-full"
            aria-label={copied ? "Copied" : "Copy prompt"}
            title="Copy prompt to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden />
            ) : (
              <Clipboard className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>{copied ? "Copied" : "Copy prompt"}</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="btn-premium-secondary flex min-h-[var(--touch-min)] items-center justify-center gap-2 py-2.5 w-full"
            aria-label={shareFeedback ? (shareFeedback === "copied" ? "Link copied" : "Shared") : "Share link"}
            title="Copy share link"
          >
            <Share2 className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              {shareFeedback === "copied" ? "Link Copied!" : shareFeedback === "shared" ? "Shared!" : "Share"}
            </span>
          </button>
          <Link
            href={`/?tweak=${design.id}#studio`}
            className="btn-premium-primary block w-full py-2.5 text-center"
          >
            Tweak this Design
          </Link>
          {collections.length > 0 && (
            <div className="flex items-center gap-2 w-full">
              <label htmlFor={`move-${design.id}`} className="text-xs text-[var(--grey)] shrink-0">
                Move to:
              </label>
              <select
                id={`move-${design.id}`}
                value={design.collectionId ?? collections[0]?.id ?? ""}
                onChange={async (e) => {
                  const collectionId = e.target.value;
                  if (!collectionId) return;
                  if (onMoveToCollectionProp) {
                    await onMoveToCollectionProp(design.id, collectionId);
                    return;
                  }
                  try {
                    const res = await fetch(`/api/designs/${design.id}/favorite`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ collection_id: collectionId }),
                    });
                    if (res.ok) router.refresh();
                  } catch {
                    // ignore
                  }
                }}
                className="input-premium flex-1 min-w-0 py-2 text-sm"
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {design.isPaid && (
            <a
              href={`/api/download?id=${encodeURIComponent(design.id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium-secondary block w-full py-2 text-center"
            >
              Download High Res
            </a>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn-premium-ghost w-full py-2 text-[var(--red)] hover:bg-[var(--red)]/10 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
