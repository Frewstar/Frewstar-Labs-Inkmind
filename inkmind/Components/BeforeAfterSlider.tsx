"use client";

import { useState, useRef, useCallback } from "react";

type BeforeAfterSliderProps = {
  beforeImageUrl: string;
  afterImageUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
};

export default function BeforeAfterSlider({
  beforeImageUrl,
  afterImageUrl,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50); // 0 = all before, 100 = all after
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(pct);
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      handleMove(e.clientX);
      const onMove = (e: PointerEvent) => handleMove(e.clientX);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [handleMove]
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-[var(--radius)] bg-[var(--bg)] select-none ${className}`}
      style={{ touchAction: "none" }}
    >
      {/* After (current) - full width, clipped by slider */}
      <div className="relative w-full" style={{ aspectRatio: "1" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={afterImageUrl}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-contain"
        />
        {/* Before (parent) - visible from left up to position */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={beforeImageUrl}
            alt={beforeLabel}
            className="absolute inset-0 w-full h-full object-contain"
          />
        </div>
        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-[var(--gold)] cursor-ew-resize flex items-center justify-center z-10"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
          onPointerDown={handlePointerDown}
          role="slider"
          aria-valuenow={position}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Compare before and after"
          tabIndex={0}
          onKeyDown={(e) => {
            const step = 5;
            if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - step));
            if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + step));
          }}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--gold)] border-2 border-[var(--bg)] flex items-center justify-center shadow-lg">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 19l-7-7 7-7" />
              <path d="M9 19l7-7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-2 text-xs text-[var(--grey)] px-1">
        <span>{beforeLabel}</span>
        <span>{afterLabel}</span>
      </div>
    </div>
  );
}
