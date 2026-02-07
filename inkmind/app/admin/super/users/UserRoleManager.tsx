"use client";

import { useState } from "react";

type Studio = { id: string; name: string; slug: string };

type UserRoleManagerProps = {
  userId: string;
  currentRole: string;
  currentStudioId?: string | null;
  studios?: Studio[];
};

export default function UserRoleManager({
  userId,
  currentRole,
  currentStudioId,
  studios = [],
}: UserRoleManagerProps) {
  const [role, setRole] = useState(currentRole);
  const [studioId, setStudioId] = useState<string>(currentStudioId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges =
    role !== currentRole ||
    studioId !== (currentStudioId ?? "");

  const handleUpdate = async () => {
    if (!hasChanges) return;
    if (role === "STUDIO_ADMIN" && !studioId) {
      setError("Select a studio for Studio Admin");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role,
          ...((role === "USER" || role === "STUDIO_ADMIN") && { studioId: studioId || null }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update role");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        disabled={loading}
        className="rounded-[var(--radius)] border border-white/20 bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--white)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] disabled:opacity-50"
      >
        <option value="USER">User</option>
        <option value="STUDIO_ADMIN">Studio Admin</option>
        <option value="SUPER_ADMIN">Super Admin</option>
      </select>

      {(role === "USER" || role === "STUDIO_ADMIN") && (
        <>
          <span className="text-xs text-[var(--grey)] shrink-0">Studio:</span>
          {studios.length > 0 ? (
            <select
              value={studioId}
              onChange={(e) => setStudioId(e.target.value)}
              disabled={loading}
              className="rounded-[var(--radius)] border border-white/20 bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--white)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] disabled:opacity-50 min-w-[160px]"
              title={role === "USER" ? "Assign user to a studio" : "Studio this admin manages"}
              aria-label="Assign to studio"
            >
              <option value="">— None —</option>
              {studios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-[var(--grey)]">
              None. <a href="/admin/super/studios" className="text-[var(--gold)] hover:underline">Create a studio</a> first.
            </span>
          )}
        </>
      )}

      {hasChanges && (
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="rounded-[var(--radius)] border border-[var(--gold)]/40 bg-[var(--gold-dim)] px-3 py-1.5 text-xs font-medium text-[var(--gold)] hover:bg-[var(--gold-glow)] hover:text-[var(--white)] transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Update"}
        </button>
      )}
      
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
      
      {success && (
        <span className="text-xs text-emerald-400">✓ Updated</span>
      )}
    </div>
  );
}
