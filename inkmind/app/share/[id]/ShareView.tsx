"use client";

import { useState } from "react";
import DesignHistorySidebar, { type DesignHistoryEntry } from "@/components/DesignHistorySidebar";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

type ShareViewProps = {
  designId: string;
  imageUrl: string | null;
  referenceImageUrl: string | null;
  /** Artist-uploaded final render (Procreate/Photoshop); shown as "The Finished Design". */
  finalImageUrl?: string | null;
  /** Direct parent image (for Before/After slider when viewing an iteration). */
  parentImageUrl?: string | null;
  prompt: string;
  creatorEmail: string | null;
  historyChain?: DesignHistoryEntry[];
};

export default function ShareView({
  designId,
  imageUrl,
  referenceImageUrl,
  finalImageUrl,
  parentImageUrl,
  prompt,
  creatorEmail,
  historyChain = [],
}: ShareViewProps) {
  const [view, setView] = useState<"result" | "reference" | "side-by-side" | "compare">("result");
  const hasReference = !!referenceImageUrl && !!imageUrl;
  const hasParentForCompare = !!parentImageUrl && !!imageUrl;
  const hasHistory = historyChain.length > 1;
  const hasFinal = !!finalImageUrl;

  if (!imageUrl && !finalImageUrl) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-8 text-center text-[var(--grey)]">
        No image available for this design.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* The Finished Design — artist upload (when present) */}
      {hasFinal && (
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] overflow-hidden">
          <h2 className="px-4 py-3 text-sm font-semibold text-[var(--white)] border-b border-white/10">
            The Finished Design
          </h2>
          <div className="relative bg-[var(--bg)] p-4 flex justify-center">
            <div className="tattoo-watermark-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={finalImageUrl!}
                alt="Finished design"
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
              <span className="tattoo-watermark" aria-hidden>InkMind</span>
            </div>
          </div>
        </div>
      )}

      {/* The Evolution — AI concepts / iterations */}
      {imageUrl && (
      <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] overflow-hidden">
        {hasFinal && (
          <h2 className="px-4 py-3 text-sm font-semibold text-[var(--white)] border-b border-white/10">
            The Evolution
          </h2>
        )}
        {hasReference && (
          <div className="flex border-b border-white/10">
            <button
              type="button"
              onClick={() => setView("result")}
              className={`flex-1 py-2.5 text-sm font-medium transition ${
                view === "result"
                  ? "bg-[var(--gold-dim)] text-[var(--gold)]"
                  : "text-[var(--grey)] hover:bg-white/5 hover:text-[var(--white)]"
              }`}
            >
              Result
            </button>
            <button
              type="button"
              onClick={() => setView("reference")}
              className={`flex-1 py-2.5 text-sm font-medium transition ${
                view === "reference"
                  ? "bg-[var(--gold-dim)] text-[var(--gold)]"
                  : "text-[var(--grey)] hover:bg-white/5 hover:text-[var(--white)]"
              }`}
            >
              Before
            </button>
            <button
              type="button"
              onClick={() => setView("side-by-side")}
              className={`flex-1 py-2.5 text-sm font-medium transition ${
                view === "side-by-side"
                  ? "bg-[var(--gold-dim)] text-[var(--gold)]"
                  : "text-[var(--grey)] hover:bg-white/5 hover:text-[var(--white)]"
              }`}
            >
              Side by side
            </button>
          </div>
        )}

        <div className="relative bg-[var(--bg)] p-4">
          {view === "result" && (
            <div className="flex justify-center">
              <div className="tattoo-watermark-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={prompt || "Generated tattoo design"}
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                />
                <span className="tattoo-watermark" aria-hidden>InkMind</span>
              </div>
            </div>
          )}

          {view === "reference" && referenceImageUrl && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={referenceImageUrl}
                alt="Reference"
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>
          )}

          {view === "side-by-side" && referenceImageUrl && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                  Reference
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={referenceImageUrl}
                  alt="Reference"
                  className="w-full object-contain"
                />
              </div>
              <div>
                <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                  Result
                </p>
                <div className="tattoo-watermark-wrap w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Result"
                    className="w-full object-contain"
                  />
                  <span className="tattoo-watermark" aria-hidden>InkMind</span>
                </div>
              </div>
            </div>
          )}

          {view === "compare" && hasParentForCompare && parentImageUrl && (
            <div className="p-4">
              <BeforeAfterSlider
                beforeImageUrl={parentImageUrl}
                afterImageUrl={imageUrl!}
                beforeLabel="Previous version"
                afterLabel="Current"
                className="max-w-lg mx-auto"
              />
            </div>
          )}
        </div>
      </div>
      )}

      {/* Prompt & optional creator */}
      <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-4">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
          Prompt
        </h2>
        <p className="text-[var(--white)]/90">{prompt || "—"}</p>
        {creatorEmail && (
          <p className="mt-3 text-sm text-[var(--grey)]">
            Shared by {creatorEmail}
          </p>
        )}
      </div>
    </div>
  );
}
