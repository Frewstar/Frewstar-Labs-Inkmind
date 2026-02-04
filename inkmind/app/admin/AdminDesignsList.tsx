"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { deleteDesign } from "./actions";

const DEBOUNCE_MS = 300;

export type DesignItem = {
  id: string;
  prompt: string;
  imageUrl: string | null;
  referenceImageUrl: string | null;
  status: string;
  createdAt: string;
  userEmail: string | null;
  studioName: string | null;
};

function DesignRow({
  design,
  onDeleted,
}: {
  design: DesignItem;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this design and its storage files?")) return;
    setLoading(true);
    const result = await deleteDesign(design.id);
    setLoading(false);
    if (!result.error) onDeleted();
    else alert(result.error);
  }

  return (
    <tr className="border-b border-white/10">
      <td className="py-3 pr-4 text-sm text-[var(--white)]/90">
        {design.userEmail ?? "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-[var(--grey)] max-w-[240px] truncate" title={design.prompt}>
        {design.prompt || "—"}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          {design.referenceImageUrl && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-[var(--grey)]">Ref</span>
              <a
                href={design.referenceImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-12 h-12 rounded-[var(--radius)] overflow-hidden border border-white/10 bg-[var(--bg)] shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={design.referenceImageUrl}
                  alt="Reference"
                  className="w-full h-full object-cover"
                  width={48}
                  height={48}
                />
              </a>
            </div>
          )}
          {design.imageUrl ? (
            <a
              href={`/api/download?url=${encodeURIComponent(design.imageUrl)}&filename=tattoo-design.png`}
              className="inline-block w-16 h-16 rounded-[var(--radius)] overflow-hidden border border-white/10 bg-[var(--bg)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={design.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                width={64}
                height={64}
              />
            </a>
          ) : (
            <span className="text-xs text-[var(--grey)]">No image</span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4 text-xs text-[var(--grey)]">
        {design.studioName ?? "—"}
      </td>
      <td className="py-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="rounded-[var(--radius)] border border-[var(--red)]/50 bg-[var(--red)]/10 px-3 py-1.5 text-xs font-medium text-[var(--red)] hover:bg-[var(--red)]/20 disabled:opacity-50"
        >
          {loading ? "…" : "Delete"}
        </button>
      </td>
    </tr>
  );
}

export default function AdminDesignsList({
  designs,
  initialQuery = "",
}: {
  designs: DesignItem[];
  initialQuery?: string;
}) {
  const [list, setList] = useState(designs);
  const [searchValue, setSearchValue] = useState(initialQuery);
  const router = useRouter();
  const pathname = usePathname();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAppliedQueryRef = useRef(initialQuery);

  useEffect(() => {
    setList(designs);
  }, [designs]);

  useEffect(() => {
    setSearchValue(initialQuery);
    lastAppliedQueryRef.current = initialQuery;
  }, [initialQuery]);

  const updateUrl = useCallback(
    (value: string) => {
      const q = value.trim();
      if (q === lastAppliedQueryRef.current) return;
      lastAppliedQueryRef.current = q;
      const url = q ? `${pathname}?query=${encodeURIComponent(q)}` : pathname;
      router.push(url);
    },
    [pathname, router]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      updateUrl(searchValue);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchValue, updateUrl]);

  function removeFromList(id: string) {
    setList((prev) => prev.filter((d) => d.id !== id));
  }

  function handleClear() {
    setSearchValue("");
    lastAppliedQueryRef.current = "";
    router.push(pathname);
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label htmlFor="admin-designs-search" className="sr-only">
          Search designs by prompt or email
        </label>
        <input
          id="admin-designs-search"
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search by prompt or email…"
          className="w-full min-w-[200px] max-w-md rounded-[var(--radius)] border border-white/15 bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--white)] placeholder:text-[var(--grey-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          autoComplete="off"
        />
        {(searchValue.length > 0) && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-[var(--radius)] border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-[var(--grey)] hover:bg-white/10 hover:text-[var(--white)]"
          >
            Clear
          </button>
        )}
      </div>
      <div className="mt-8 overflow-x-auto rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)]">
      {list.length === 0 ? (
        <div className="p-8 text-center text-[var(--grey)]">
          {searchValue.trim() ? "No designs match your search." : "No designs yet."}
        </div>
      ) : (
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="py-3 pr-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                User
              </th>
              <th className="py-3 pr-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                Prompt
              </th>
              <th className="py-3 pr-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                Reference / Result
              </th>
              <th className="py-3 pr-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                Studio
              </th>
              <th className="py-3 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <DesignRow
                key={d.id}
                design={d}
                onDeleted={() => removeFromList(d.id)}
              />
            ))}
          </tbody>
        </table>
      )}
      </div>
    </>
  );
}
