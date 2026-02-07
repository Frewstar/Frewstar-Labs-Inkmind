"use client";

import { useState } from "react";

export type SubmitToStudioButtonProps = {
  designId: string;
  studioId: string;
  rossReasoning?: string | null;
  onSuccess?: () => void;
  /** Compact mode for gallery cards — smaller button */
  compact?: boolean;
  className?: string;
};

export default function SubmitToStudioButton({
  designId,
  studioId,
  rossReasoning,
  onSuccess,
  compact = false,
  className = "",
}: SubmitToStudioButtonProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  const handleSubmit = async () => {
    setStatus("submitting");
    try {
      const res = await fetch(`/api/designs/${designId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(rossReasoning && { rossReasoning }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Submit failed");
      setStatus("success");
      onSuccess?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submit failed");
      setStatus("idle");
    }
  };

  return (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={status === "submitting" || status === "success"}
      className={`font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
        compact ? "py-2 px-3 text-xs" : "w-full mt-4 py-3"
      } ${className}`}
      style={{
        background: status === "success" ? "var(--gold-dim)" : "var(--gold)",
        color: "black",
      }}
    >
      {status === "submitting" && (
        <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin shrink-0" />
      )}
      {status === "success" ? "✓ Sent" : compact ? "Send to Artist" : "Send to Artist for Final Review"}
    </button>
  );
}
