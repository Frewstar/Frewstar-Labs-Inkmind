"use client";

const MIN = 1.5;
const MAX = 5.0;
const STEP = 0.1;
const DEFAULT = 3.0;

export type StyleStrengthSliderProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function StyleStrengthSlider({
  value,
  onChange,
  disabled = false,
}: StyleStrengthSliderProps) {
  const clamped = Math.min(MAX, Math.max(MIN, value));
  const hint =
    clamped < 2.5
      ? "More creative freedom for the AI."
      : clamped > 4.0
        ? "Strictly follows studio portfolio DNA."
        : "Balanced studio–client harmony.";

  return (
    <div className="space-y-3 p-4 rounded-[var(--radius)] border border-white/10 bg-[var(--bg)]/50">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-[var(--grey)]">
          Style Adherence (DNA Strength)
        </label>
        <span className="text-xs font-mono bg-purple-500/10 px-2 py-1 rounded text-purple-400 border border-purple-500/20">
          {clamped.toFixed(1)}x
        </span>
      </div>
      <input
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={clamped}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
          [--track:var(--bg-card)] [--thumb:var(--gold)]
          bg-[var(--track)] accent-[var(--gold)]
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--thumb)] [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:border-0
          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-[var(--thumb)] [&::-moz-range-thumb]:border-0"
        aria-label="Style adherence (DNA strength)"
      />
      <p className="text-[10px] text-[var(--grey)] italic">{hint}</p>
    </div>
  );
}

export { MIN as STYLE_STRENGTH_MIN, MAX as STYLE_STRENGTH_MAX, DEFAULT as STYLE_STRENGTH_DEFAULT };
