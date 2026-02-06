"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BYTES_PER_MB = 1_048_576;

function mb(bytes: number): string {
  return (bytes / BYTES_PER_MB).toFixed(1);
}

type Studio = { id: string; name: string; slug: string };
type DesignItem = {
  id: string;
  prompt: string;
  imageUrl: string | null;
  referenceImageUrl: string | null;
  finalImageUrl: string | null;
  status: string;
  createdAt: string;
  userEmail: string | null;
};
type UserItem = { id: string; email: string | null };

type Props = {
  studio: Studio;
  designs: DesignItem[];
  users: UserItem[];
  storageEstimateBytes: number;
  storageLimitBytes: number;
  storagePercent: number;
};

export default function StudioAdminDashboard({
  studio,
  designs,
  users,
  storageEstimateBytes,
  storageLimitBytes,
  storagePercent,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "users">("overview");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const barColor =
    storagePercent < 70
      ? "bg-emerald-500"
      : storagePercent < 90
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div
      className="min-h-[100dvh] px-4 py-8"
      style={{
        background: "var(--bg)",
        paddingLeft: "calc(1rem + var(--safe-left))",
        paddingRight: "calc(1rem + var(--safe-right))",
        paddingBottom: "calc(2rem + var(--safe-bottom))",
      }}
    >
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <Link
            href="/"
            className="text-sm text-[var(--grey)] hover:text-[var(--gold)] transition mb-2 inline-block"
          >
            ← Back to app
          </Link>
          <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)]">
            {studio.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--grey)]">
            Studio Admin · {studio.slug}
          </p>
        </header>

        <div className="flex gap-2 border-b border-white/10 mb-6 flex-wrap">
          <button
            type="button"
            onClick={() => setTab("overview")}
            className={`px-4 py-2 text-sm font-medium transition rounded-t-[var(--radius)] ${
              tab === "overview"
                ? "bg-[var(--bg-card)] text-[var(--gold)] border border-white/10 border-b-transparent -mb-px"
                : "text-[var(--grey)] hover:text-[var(--white)]"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`px-4 py-2 text-sm font-medium transition rounded-t-[var(--radius)] ${
              tab === "users"
                ? "bg-[var(--bg-card)] text-[var(--gold)] border border-white/10 border-b-transparent -mb-px"
                : "text-[var(--grey)] hover:text-[var(--white)]"
            }`}
          >
            User Management
          </button>
          <Link
            href={`/${studio.slug}/settings/portfolio`}
            className="px-4 py-2 text-sm font-medium text-[var(--grey)] hover:text-[var(--white)] transition rounded-t-[var(--radius)]"
          >
            Portfolio
          </Link>
          <Link
            href={`/${studio.slug}/settings`}
            className="px-4 py-2 text-sm font-medium text-[var(--grey)] hover:text-[var(--white)] transition rounded-t-[var(--radius)]"
          >
            Settings
          </Link>
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <div className="rounded-[var(--radius)] border border-white/10 bg-[var(--bg-card)] p-3">
              <p className="mb-2 text-xs font-medium text-[var(--grey)]">
                Storage (this studio)
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--white)]/80">
                {mb(storageEstimateBytes)} MB of 1 GB used ({designs.length} designs)
              </p>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] overflow-hidden">
              <h2 className="px-4 py-3 text-sm font-semibold text-[var(--white)] border-b border-white/10">
                Final Design · Designs ({designs.length})
              </h2>
              <p className="px-4 py-2 text-xs text-[var(--grey)] border-b border-white/10">
                Mark a design as artist-ready by uploading your final drawing (JPG/PNG). Clients will see it at the top of the share page.
              </p>
              {designs.length === 0 ? (
                <div className="p-8 text-center text-[var(--grey)] text-sm">
                  No designs in this studio yet.
                </div>
              ) : (
                <ul className="divide-y divide-white/10 max-h-[60vh] overflow-y-auto">
                  {designs.slice(0, 50).map((d) => (
                    <li key={d.id} className="flex items-center gap-4 p-4 hover:bg-white/5">
                      {d.imageUrl && (
                        <Link
                          href={`/${studio.slug}?edit=${d.id}`}
                          className="shrink-0 w-14 h-14 rounded-[var(--radius)] overflow-hidden border border-white/10 bg-[var(--bg)] block focus:ring-2 ring-[var(--gold)]"
                          title="Edit: load into Reference slot"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={d.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            width={56}
                            height={56}
                          />
                        </Link>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[var(--white)]/90 truncate" title={d.prompt}>
                          {d.prompt || "—"}
                        </p>
                        <p className="text-xs text-[var(--grey)] mt-0.5">
                          {d.userEmail ?? "Unknown"} · {d.status}
                        </p>
                      </div>
                      {d.imageUrl && (
                        <a
                          href={`/api/download?url=${encodeURIComponent(d.imageUrl)}&filename=tattoo-design.png`}
                          className="shrink-0 text-xs text-[var(--grey)] hover:text-[var(--gold)] transition"
                        >
                          Download
                        </a>
                      )}
                      <span className="shrink-0 flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          ref={(el) => {
                            fileInputRefs.current[d.id] = el;
                          }}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setUploadingId(d.id);
                            try {
                              const form = new FormData();
                              form.append("file", f);
                              const res = await fetch(`/api/designs/${d.id}/final-image`, {
                                method: "POST",
                                body: form,
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.message || data.error || "Upload failed");
                              router.refresh();
                            } catch (err) {
                              alert(err instanceof Error ? err.message : "Upload failed");
                            } finally {
                              setUploadingId(null);
                              e.target.value = "";
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[d.id]?.click()}
                          disabled={!!uploadingId}
                          className="shrink-0 text-xs text-[var(--grey)] hover:text-[var(--gold)] transition disabled:opacity-50"
                          title="Upload your final drawing (JPG/PNG); clients see it as Artist Drawing"
                        >
                          {uploadingId === d.id ? "Uploading…" : d.finalImageUrl ? "Replace Artist Drawing" : "Mark as Artist Ready"}
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {designs.length > 50 && (
                <p className="px-4 py-2 text-xs text-[var(--grey)] border-t border-white/10">
                  Showing first 50 of {designs.length} designs.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] overflow-hidden">
            <h2 className="px-4 py-3 text-sm font-semibold text-[var(--white)] border-b border-white/10">
              Users in this studio
            </h2>
            {users.length === 0 ? (
              <div className="p-8 text-center text-[var(--grey)] text-sm">
                No users have created designs in this studio yet.
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {users.map((u) => (
                  <li key={u.id} className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-[var(--white)]/90">
                      {u.email ?? "No email"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
