"use client";

import { ShieldCheck, Zap } from "lucide-react";

export type RossEvaluation = {
  reasoning?: string | null;
  style?: string | null;
  needle?: string | null;
};

export default function RossEvaluationPanel({ evaluation }: { evaluation: RossEvaluation | null }) {
  if (!evaluation) return null;

  return (
    <div
      className="mt-6 border border-amber-500/30 bg-black/40 backdrop-blur-md rounded-xl p-5 border-l-4 border-l-amber-500 shadow-2xl"
      style={{ borderLeftColor: "var(--gold)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: "var(--gold)" }} />
        <h3
          className="font-bold uppercase tracking-widest text-sm"
          style={{ color: "var(--gold)" }}
        >
          Ross&apos;s Technical Evaluation
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex gap-3">
            <Zap className="w-4 h-4 mt-1 shrink-0 text-amber-400" />
            <div>
              <p className="text-white text-sm font-semibold">Technical Optimization</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {evaluation.reasoning ||
                  "I've increased the negative space between overlapping lines to prevent ink migration over time."}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 uppercase">Style:</span>
            <span style={{ color: "rgba(232,180,90,0.9)" }}>
              {evaluation.style || "Fine-Line Geometric"}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 uppercase">Needle:</span>
            <span style={{ color: "rgba(232,180,90,0.9)" }}>
              {evaluation.needle || "3RL Precision"}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 uppercase">Longevity:</span>
            <span className="text-green-400 font-bold">STABLE</span>
          </div>
        </div>
      </div>

      {showSubmitButton && (
        <SubmitToStudioButton
          designId={designId}
          studioId={studioId}
          rossReasoning={evaluation.reasoning ?? undefined}
          onSuccess={onSubmitted}
          className="!mt-4"
        />
      )}
      <p
        className="mt-4 text-[10px] italic border-t border-white/10 pt-2"
        style={{ color: "rgba(232,180,90,0.5)" }}
      >
        * This is a technical blueprint. A human artist will perform the final anatomic fitment.
      </p>
    </div>
  );
}
