import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Platform Settings | Super Admin | InkMind",
  description: "Configure platform-wide settings.",
};

export default async function SuperSettingsPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
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
          Platform Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--grey)]">
          Configure platform-wide settings and preferences.
        </p>
      </div>

      {/* Account Info */}
      <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-[var(--white)]">
            Account Information
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--grey)] mb-2">
              Email
            </label>
            <p className="text-sm text-[var(--white)]">{user?.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[var(--grey)] mb-2">
              User ID
            </label>
            <p className="text-xs font-mono text-[var(--grey)] break-all">{user?.id}</p>
          </div>
        </div>
      </div>

      {/* Platform Configuration */}
      <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-[var(--white)]">
            Platform Configuration
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-sm font-medium text-[var(--white)]">
                Studio Creation
              </p>
              <p className="text-xs text-[var(--grey)] mt-1">
                Allow new studio registrations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-[var(--radius)] text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                Enabled
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-sm font-medium text-[var(--white)]">
                Design Generation
              </p>
              <p className="text-xs text-[var(--grey)] mt-1">
                Platform-wide design generation status
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-[var(--radius)] text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-[var(--white)]">
                API Access
              </p>
              <p className="text-xs text-[var(--grey)] mt-1">
                External API integrations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-[var(--radius)] text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                Enabled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage & Limits */}
      <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-[var(--white)]">
            Storage & Limits
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-sm font-medium text-[var(--white)]">
                Default Studio Storage
              </p>
              <p className="text-xs text-[var(--grey)] mt-1">
                Storage limit per studio
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--gold)]">
              500 MB
            </p>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-sm font-medium text-[var(--white)]">
                Max Designs per Studio
              </p>
              <p className="text-xs text-[var(--grey)] mt-1">
                Design generation limit
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--gold)]">
              Unlimited
            </p>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-[var(--white)]">
                Image Resolution
              </p>
              <p className="text-xs text-[var(--grey)] mt-1">
                Default generation resolution
              </p>
            </div>
            <p className="text-sm font-semibold text-[var(--gold)]">
              1024×1024
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-[var(--radius-lg)] border border-red-500/30 bg-red-500/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-red-500/20">
          <h2 className="text-sm font-semibold text-red-400">
            Danger Zone
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--white)]">
                Platform Maintenance Mode
              </p>
              <p className="text-xs text-[var(--grey)] mt-1">
                Temporarily disable all platform access
              </p>
            </div>
            <button
              className="px-4 py-2 rounded-[var(--radius)] border border-red-500/40 bg-red-500/10 text-sm font-medium text-red-400 hover:bg-red-500/20 transition"
              disabled
            >
              Enable Maintenance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
