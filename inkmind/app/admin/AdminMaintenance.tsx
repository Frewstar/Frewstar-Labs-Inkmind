"use client";

import { useState } from "react";

type PurgeResult =
  | { count: number; totalSizeEstimate: string; mode: "dry-run" | "live" }
  | { error: string };

export default function AdminMaintenance() {
  const [loading, setLoading] = useState<"idle" | "dry" | "live">("idle");
  const [result, setResult] = useState<PurgeResult | null>(null);

  async function runPurge(dryRun: boolean) {
    if (dryRun) {
      setLoading("dry");
    } else {
      setLoading("live");
    }
    setResult(null);

    try {
      const res = await fetch("/api/admin/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data: PurgeResult = await res.json().catch(() => ({ error: "Invalid response" }));
      if (!res.ok) {
        setResult("error" in data ? data : { error: data?.error ?? "Request failed" });
        return;
      }
      setResult(data);
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setLoading("idle");
    }
  }

  function handleCheckJunk() {
    runPurge(true);
  }

  function handlePurgeNow() {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    runPurge(false);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-6">
      <h2 className="font-[var(--font-head)] text-lg font-semibold text-[var(--white)]">
        Maintenance
      </h2>
      <p className="mt-1 text-sm text-[var(--grey)]">
        Remove non-favorite designs older than 30 days to free storage. Run a dry run first to see what would be removed.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCheckJunk}
          disabled={loading !== "idle"}
          className="rounded-[var(--radius)] border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--white)] transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading === "dry" ? "Checking…" : "Check for Junk"}
        </button>
        <button
          type="button"
          onClick={handlePurgeNow}
          disabled={loading !== "idle"}
          className="rounded-[var(--radius)] border border-[var(--red)]/40 bg-[var(--red)]/10 px-4 py-2 text-sm font-medium text-[var(--red)] transition hover:bg-[var(--red)]/20 disabled:opacity-50"
        >
          {loading === "live" ? "Purging…" : "Purge Now"}
        </button>
      </div>
      {result && (
        <div
          className="mt-4 rounded-[var(--radius)] border p-3 text-sm"
          style={{
            borderColor: "error" in result ? "var(--red)" : "rgba(255,255,255,0.2)",
            background: "error" in result ? "rgba(201,64,64,0.1)" : "rgba(255,255,255,0.05)",
          }}
        >
          {"error" in result ? (
            <p className="text-[var(--red)]">{result.error}</p>
          ) : result.mode === "dry-run" ? (
            <p className="text-[var(--white)]/90">
              Found <strong>{result.count}</strong> old design{result.count !== 1 ? "s" : ""}. Total
              estimated saving: <strong>{result.totalSizeEstimate}</strong>.
            </p>
          ) : (
            <p className="text-[var(--white)]/90">
              Purged <strong>{result.count}</strong> design{result.count !== 1 ? "s" : ""}. Freed
              approximately <strong>{result.totalSizeEstimate}</strong>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
