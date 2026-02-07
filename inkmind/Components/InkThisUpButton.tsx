"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import type { RossEvaluation } from "./RossEvaluationPanel";

export type InkThisUpButtonProps = {
  currentPrompt: string;
  onRossRefine: (refinedPrompt: string) => void;
  /** Called when Ross processes an image and returns technical evaluation (reasoning, style, needle). */
  onEvaluation?: (evaluation: RossEvaluation) => void;
  /** When provided, Ross uses the Vision protocol to convert the image into a skin-safe tattoo spec. */
  referenceImageUrl?: string | null;
  studioId?: string | null;
  disabled?: boolean;
  className?: string;
};

export default function InkThisUpButton({
  currentPrompt,
  onRossRefine,
  onEvaluation,
  referenceImageUrl,
  studioId,
  disabled = false,
  className = "",
}: InkThisUpButtonProps) {
  const [isRefining, setIsRefining] = useState(false);

  const handleRossRefine = async () => {
    setIsRefining(true);
    try {
      const url = referenceImageUrl
        ? "/api/ai/ross-process-image"
        : "/api/ai/ross-refine";
      const body = referenceImageUrl
        ? { imageUrl: referenceImageUrl, userNote: currentPrompt || undefined }
        : { prompt: currentPrompt, ...(studioId && { studioId }) };
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to refine prompt");
      }
      if (data.refinedPrompt) {
        onRossRefine(data.refinedPrompt);
      }
      if (data.evaluation && onEvaluation) {
        onEvaluation(data.evaluation);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to refine prompt");
    } finally {
      setIsRefining(false);
    }
  };

  const isDisabled = disabled || isRefining || (!currentPrompt.trim() && !referenceImageUrl?.trim());

  return (
    <button
      type="button"
      onClick={handleRossRefine}
      disabled={isDisabled}
      className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium text-sm ${className}`}
      title="Have Ross refine your idea into a professional tattoo specification"
    >
      <Sparkles className="w-4 h-4 shrink-0" />
      {isRefining ? "Ross is thinking..." : "Ross, Ink This Up"}
    </button>
  );
}
