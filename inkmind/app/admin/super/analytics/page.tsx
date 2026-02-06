import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Analytics | Super Admin | InkMind",
  description: "Platform analytics and metrics.",
};

export default async function SuperAnalyticsPage() {
  const supabase = await createClient();

  // Fetch data for analytics
  const [studiosRes, designsRes, profilesRes] = await Promise.all([
    supabase.from("studios").select("id, created_at"),
    supabase.from("designs").select("id, created_at, status"),
    supabase.from("profiles").select("id"),
  ]);

  const studios = studiosRes.data ?? [];
  const designs = designsRes.data ?? [];
  const profiles = profilesRes.data ?? [];

  // Calculate metrics
  const totalStudios = studios.length;
  const totalDesigns = designs.length;
  const totalUsers = profiles.length;
  const pendingDesigns = designs.filter((d) => d.status === "pending").length;
  const approvedDesigns = designs.filter((d) => d.status === "approved").length;

  // Growth metrics (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newStudiosThisWeek = studios.filter(
    (s) => new Date(s.created_at) > sevenDaysAgo
  ).length;

  const newDesignsThisWeek = designs.filter(
    (d) => new Date(d.created_at) > sevenDaysAgo
  ).length;

  // Average designs per studio
  const avgDesignsPerStudio =
    totalStudios > 0 ? (totalDesigns / totalStudios).toFixed(1) : "0";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="text-sm text-[var(--grey)] hover:text-[var(--gold)] transition"
        >
          ← Admin
        </Link>
        <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)] mt-2">
          Platform Analytics
        </h1>
        <p className="mt-1 text-sm text-[var(--grey)]">
          Monitor platform growth and usage metrics.
        </p>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--gold)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                Total Studios
              </p>
              <p className="text-3xl font-semibold text-[var(--white)]">
                {totalStudios}
              </p>
            </div>
          </div>
          <p className="text-xs text-emerald-400">
            +{newStudiosThisWeek} this week
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--gold)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                Total Designs
              </p>
              <p className="text-3xl font-semibold text-[var(--white)]">
                {totalDesigns}
              </p>
            </div>
          </div>
          <p className="text-xs text-emerald-400">
            +{newDesignsThisWeek} this week
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg)] p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--gold)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                Total Users
              </p>
              <p className="text-3xl font-semibold text-[var(--white)]">
                {totalUsers}
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--grey)]">
            Platform registered users
          </p>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-6">
          <h3 className="text-sm font-semibold text-[var(--white)] mb-4">
            Design Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--grey)]">Pending Review</span>
              <span className="text-sm font-semibold text-amber-400">
                {pendingDesigns}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--grey)]">Approved</span>
              <span className="text-sm font-semibold text-emerald-400">
                {approvedDesigns}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--grey)]">Total</span>
              <span className="text-sm font-semibold text-[var(--white)]">
                {totalDesigns}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-6">
          <h3 className="text-sm font-semibold text-[var(--white)] mb-4">
            Platform Health
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--grey)]">
                Avg Designs per Studio
              </span>
              <span className="text-sm font-semibold text-[var(--gold)]">
                {avgDesignsPerStudio}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--grey)]">Active Studios</span>
              <span className="text-sm font-semibold text-[var(--white)]">
                {totalStudios}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--grey)]">Growth (7 days)</span>
              <span className="text-sm font-semibold text-emerald-400">
                +{newStudiosThisWeek} studios, +{newDesignsThisWeek} designs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-6">
        <h3 className="text-sm font-semibold text-[var(--white)] mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/super/studios"
            className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-white/20 bg-[var(--bg)] px-4 py-2 text-sm font-medium text-[var(--white)] hover:bg-white/10 transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Manage Studios
          </Link>
          <Link
            href="/admin/super/users"
            className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-white/20 bg-[var(--bg)] px-4 py-2 text-sm font-medium text-[var(--white)] hover:bg-white/10 transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Manage Users
          </Link>
          <Link
            href="/admin/super/designs"
            className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--gold)]/40 bg-[var(--gold-dim)] px-4 py-2 text-sm font-medium text-[var(--gold)] hover:bg-[var(--gold-glow)] hover:text-[var(--white)] transition"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            View All Designs
          </Link>
        </div>
      </div>
    </div>
  );
}
