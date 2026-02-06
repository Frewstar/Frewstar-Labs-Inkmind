"use client";

import { useState, useRef, useEffect } from "react";

type HelpTooltipProps = {
  text: string;
  /** Optional accessible label (e.g. "Learn more about Personality") */
  label?: string;
};

export default function HelpTooltip({ text, label = "Help" }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <span ref={wrapRef} className="inline-flex items-center relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-label={label}
        aria-expanded={open}
        className="ml-1.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--grey)]/50 bg-[var(--bg)] text-[var(--grey)] hover:border-[var(--gold)]/50 hover:text-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:ring-offset-1 focus:ring-offset-[var(--bg-card)] transition"
      >
        <span className="text-[10px] font-semibold leading-none">?</span>
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-1.5 max-w-[240px] rounded-[var(--radius)] border border-white/10 bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--white)] shadow-lg"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
