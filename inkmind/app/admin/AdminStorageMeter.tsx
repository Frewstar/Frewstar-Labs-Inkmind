import { getStorageUsage } from "./actions";
import { STORAGE_LIMIT_BYTES } from "./constants";

const LIMIT_BYTES = STORAGE_LIMIT_BYTES;
const BYTES_PER_MB = 1_048_576;

function mb(bytes: number): string {
  return (bytes / BYTES_PER_MB).toFixed(1);
}

type Props = {
  /** When set, meter shows storage scoped to this studio (e.g. in /studio/[slug]). Omit for global total (e.g. /admin, /admin/super). */
  studioId?: string | null;
};

export default async function AdminStorageMeter({ studioId }: Props = {}) {
  const { totalBytes } = await getStorageUsage(studioId ?? undefined);
  const percent = Math.min(100, (totalBytes / LIMIT_BYTES) * 100);

  const barColor =
    percent < 70
      ? "bg-emerald-500"
      : percent < 90
        ? "bg-amber-500"
        : "bg-red-500";

  const label = studioId ? "Storage (this studio)" : "Storage";

  return (
    <div className="rounded-[var(--radius)] border border-white/10 bg-[var(--bg)] p-3">
      <p className="mb-2 text-xs font-medium text-[var(--grey)]">
        {label}
      </p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--white)]/80">
        {mb(totalBytes)} MB of 1 GB used
      </p>
    </div>
  );
}
