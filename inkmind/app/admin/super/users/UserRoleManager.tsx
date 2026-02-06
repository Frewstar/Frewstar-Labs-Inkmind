"use client";

import { useState } from "react";

type UserRoleManagerProps = {
  userId: string;
  currentRole: string;
};

export default function UserRoleManager({ userId, currentRole }: UserRoleManagerProps) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async () => {
    if (role === currentRole) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
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
    <div className="flex items-center gap-2">
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
      
      {role !== currentRole && (
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
