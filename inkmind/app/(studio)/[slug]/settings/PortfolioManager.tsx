"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { addStudioPortfolioEntry, updateStudioPersonality, type AddStudioPortfolioResult } from "@/app/admin/actions";
import { extractStudioDNA } from "@/app/actions/portfolio";

type PortfolioManagerProps = {
  slug: string;
  studioId: string;
  entries: {
    id: string;
    image_url: string;
    title: string | null;
    style_tags: string[];
    technical_notes: string | null;
    created_at: string;
  }[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full min-h-[var(--touch-min)] rounded-[var(--radius)] bg-[var(--gold)] px-4 py-3 font-medium text-[var(--bg)] transition hover:bg-[var(--gold)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] disabled:opacity-70 disabled:pointer-events-none"
    >
      {pending ? "Uploading…" : "Save to portfolio"}
    </button>
  );
}

export default function PortfolioManager({ slug, studioId, entries }: PortfolioManagerProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dnaLoading, setDnaLoading] = useState(false);
  const [dnaResult, setDnaResult] = useState<string | null>(null);
  const [dnaError, setDnaError] = useState<string | null>(null);
  const [state, formAction] = useActionState(
    async (_prev: AddStudioPortfolioResult, formData: FormData) => {
      return addStudioPortfolioEntry(slug, formData);
    },
    {}
  );

  useEffect(() => {
    if (state?.success) {
      setToast({ type: "success", message: "Portfolio entry added. Ross will use this for style guidance." });
      router.refresh();
    }
    if (state?.error) setToast({ type: "error", message: state.error });
  }, [state, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-[var(--white)]">
          Style references for AI
        </h2>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
          AI Training Mode Active
        </span>
      </div>
      <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={async () => {
            setDnaError(null);
            setDnaResult(null);
            setDnaLoading(true);
            const res = await extractStudioDNA(studioId);
            if (res.error) {
              setDnaLoading(false);
              setDnaError(res.error);
              return;
            }
            if (res.dna) {
              setDnaResult(res.dna);
              const save = await updateStudioPersonality(slug, res.dna);
              if (save.success) {
                setToast({ type: "success", message: "Ross has learned your style!" });
                router.refresh();
              } else {
                setToast({ type: "error", message: save.error ?? "Could not save to Ross." });
              }
            }
            setDnaLoading(false);
          }}
          disabled={dnaLoading || entries.length === 0}
          className="rounded-[var(--radius)] px-3 py-2 text-xs font-medium border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)] disabled:opacity-60 disabled:pointer-events-none transition"
        >
          {dnaLoading ? "Analyzing Portfolio…" : "✨ Auto-Generate Style DNA"}
        </button>
        {entries.length === 0 && (
          <span className="text-xs text-[var(--grey)]">Upload at least one image first.</span>
        )}
      </div>
      {(dnaResult !== null || dnaError) && (
        <div className="px-4 py-3 border-b border-white/10 space-y-2">
          {dnaError && (
            <p className="text-xs text-[var(--red)]">{dnaError}</p>
          )}
          {dnaResult && (
            <>
              <p className="text-xs font-medium text-[var(--grey)]">Style Guide (copy for technical notes)</p>
              <div className="rounded-[var(--radius)] border border-white/10 bg-[var(--bg)] p-3 text-xs text-[var(--white)] whitespace-pre-wrap max-h-40 overflow-y-auto">
                {dnaResult}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(dnaResult);
                  setToast({ type: "success", message: "Style Guide copied to clipboard." });
                }}
                className="text-xs text-[var(--gold)] hover:underline"
              >
                Copy to clipboard
              </button>
            </>
          )}
        </div>
      )}
      <p className="px-4 py-2 text-xs text-[var(--grey)] border-b border-white/10">
        These images and notes are used to teach Ross your studio’s signature style. Add pieces you want the assistant to reference (e.g. “Geometric Rose”, “Whip shading”, “3RL for fine details”).
      </p>

      {toast && (
        <div
          role="alert"
          className={`mx-4 mt-3 px-4 py-2 rounded-[var(--radius)] text-sm font-medium ${
            toast.type === "success"
              ? "bg-emerald-600/95 text-white"
              : "bg-red-600/95 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <form action={formAction} className="p-5 space-y-4" encType="multipart/form-data">
        <div>
          <label htmlFor="portfolio-image" className="block text-xs font-medium text-[var(--grey)] mb-1">
            Image
          </label>
          <input
            id="portfolio-image"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            className="studio-settings-input text-sm file:mr-2 file:rounded file:border-0 file:bg-[var(--gold)] file:px-3 file:py-1.5 file:text-[var(--bg)] file:text-sm"
          />
          <p className="mt-1 text-xs text-[var(--grey)]">JPG, PNG or WebP. Max 10 MB.</p>
        </div>
        <div>
          <label htmlFor="portfolio-title" className="block text-xs font-medium text-[var(--grey)] mb-1">
            Title (optional)
          </label>
          <input
            id="portfolio-title"
            name="title"
            type="text"
            placeholder="e.g. Geometric Rose"
            className="studio-settings-input"
            maxLength={120}
          />
        </div>
        <div>
          <label htmlFor="portfolio-style-tags" className="block text-xs font-medium text-[var(--grey)] mb-1">
            Style tags
          </label>
          <input
            id="portfolio-style-tags"
            name="style_tags"
            type="text"
            placeholder="e.g. Neo-Traditional, Whip Shading, Fine Line"
            className="studio-settings-input"
          />
          <p className="mt-1 text-xs text-[var(--grey)]">Comma-separated. Used to match client ideas to your work.</p>
        </div>
        <div>
          <label htmlFor="portfolio-technical-notes" className="block text-xs font-medium text-[var(--grey)] mb-1">
            Technical notes for AI
          </label>
          <textarea
            id="portfolio-technical-notes"
            name="technical_notes"
            rows={3}
            placeholder="e.g. Used 3RL for fine details, soft grey wash. Bold outlines with whip shading."
            className="studio-settings-input min-h-[72px] resize-y w-full"
          />
          <p className="mt-1 text-xs text-[var(--grey)]">Ross uses this to guide suggestions (needles, technique, palette).</p>
        </div>
        <SubmitButton />
      </form>

      {entries.length > 0 && (
        <div className="border-t border-white/10 p-4">
          <h3 className="text-xs font-semibold text-[var(--white)] mb-3">
            Current references ({entries.length})
          </h3>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {entries.map((e) => (
              <li
                key={e.id}
                className="rounded-[var(--radius)] border border-white/10 overflow-hidden bg-[var(--bg)]"
              >
                <img
                  src={e.image_url}
                  alt={e.title || "Portfolio piece"}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-2">
                  <p className="text-xs font-medium text-[var(--white)] truncate">
                    {e.title || "Untitled"}
                  </p>
                  {e.style_tags.length > 0 && (
                    <p className="text-[10px] text-[var(--grey)] truncate">
                      {e.style_tags.join(", ")}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
