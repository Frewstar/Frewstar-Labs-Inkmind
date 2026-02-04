"use client";

const DAILY_CAP = 5;

type Props = {
  dailyGenerations: number;
};

export default function GenerationTracker({ dailyGenerations }: Props) {
  const left = Math.max(0, dailyGenerations);
  const isZero = left === 0;
  const percent = DAILY_CAP > 0 ? (left / DAILY_CAP) * 100 : 0;

  return (
    <div className="rounded-[var(--radius)] border border-white/10 bg-[var(--bg)] p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
        Daily generations
      </p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            isZero ? "bg-[var(--red)]" : "bg-[var(--gold)]"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p
        className={`mt-2 text-sm font-medium ${
          isZero ? "text-[var(--red)]" : "text-[var(--white)]/90"
        }`}
      >
        {isZero ? (
          <>0 left · Refills in 24h</>
        ) : (
          <>{left} generation{left !== 1 ? "s" : ""} left</>
        )}
      </p>
    </div>
  );
}
