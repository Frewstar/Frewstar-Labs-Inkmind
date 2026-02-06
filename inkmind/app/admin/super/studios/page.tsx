import { createClient } from "@/utils/supabase/server";
import { getCurrentSuperAdminProfile } from "@/app/admin/actions";
import SuperStudiosForm from "./SuperStudiosForm";
import Link from "next/link";

const ESTIMATE_BYTES_PER_DESIGN = 800 * 1024;

function mb(bytes: number): string {
  return (bytes / 1_048_576).toFixed(1);
}

export const metadata = {
  title: "Studio Management | Super Admin | InkMind",
  description: "Create studios and assign studio admins.",
};

export default async function SuperStudiosPage() {
  const supabase = await createClient();
  const [studiosRes, designsRes] = await Promise.all([
    supabase.from("studios").select("id, name, slug, logo_url, contact_email, contact_phone, address").order("name", { ascending: true }),
    supabase.from("designs").select("studio_id"),
  ]);

  const studios = studiosRes.data ?? [];
  const designCountByStudio = new Map<string, number>();
  for (const d of designsRes.data ?? []) {
    if (d.studio_id) {
      designCountByStudio.set(d.studio_id, (designCountByStudio.get(d.studio_id) ?? 0) + 1);
    }
  }

  const totalStudios = studios.length;
  const totalDesigns = (designsRes.data ?? []).length;
  const topStudio = studios.length > 0
    ? studios.reduce((a, b) => {
        const ac = designCountByStudio.get(a.id) ?? 0;
        const bc = designCountByStudio.get(b.id) ?? 0;
        return bc > ac ? b : a;
      })
    : null;
  const topStudioCount = topStudio ? (designCountByStudio.get(topStudio.id) ?? 0) : 0;
  const currentUserProfile = await getCurrentSuperAdminProfile();

  const rows = studios.map((s) => {
    const designCount = designCountByStudio.get(s.id) ?? 0;
    const estimatedBytes = designCount * ESTIMATE_BYTES_PER_DESIGN;
    const hasLogo = Boolean(s.logo_url?.trim());
    const hasContact =
      Boolean(s.contact_email?.trim()) ||
      Boolean(s.contact_phone?.trim()) ||
      Boolean(s.address?.trim());
    const profileStatus = hasLogo && hasContact ? "Complete" : "Pending";
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      adminEmail: "—",
      designCount,
      storageEstimate: mb(estimatedBytes),
      profileStatus,
    };
  });

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
          Studio Management
        </h1>
        <p className="mt-1 text-sm text-[var(--grey)]">
          Create studios and assign a profile as Studio Admin.
        </p>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-6">
        <h2 className="text-sm font-semibold text-[var(--white)] mb-4">
          Global Analytics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-[var(--radius)] border border-white/10 bg-[var(--bg)] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
              Total Studios
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--white)]">
              {totalStudios}
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-white/10 bg-[var(--bg)] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
              Top Studio
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--white)] truncate" title={topStudio?.name ?? undefined}>
              {topStudio ? `${topStudio.name} (${topStudioCount} designs)` : "—"}
            </p>
            {topStudio && (
              <Link
                href={`/${topStudio.slug}`}
                className="mt-2 inline-block text-xs text-[var(--gold)] hover:underline"
              >
                Open portal →
              </Link>
            )}
          </div>
          <div className="rounded-[var(--radius)] border border-white/10 bg-[var(--bg)] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
              Credit usage (designs)
            </p>
            <p className="mt-1 text-2xl font-semibold text-[var(--white)]">
              {totalDesigns.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <SuperStudiosForm currentUserProfile={currentUserProfile ?? undefined} />

      <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] overflow-hidden">
        <h2 className="px-4 py-3 text-sm font-semibold text-[var(--white)] border-b border-white/10">
          All Studios
        </h2>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-[var(--grey)] text-sm">
            No studios yet. Create one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="py-3 px-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                    Name
                  </th>
                  <th className="py-3 px-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                    Slug
                  </th>
                  <th className="py-3 px-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                    Status
                  </th>
                  <th className="py-3 px-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                    Admin
                  </th>
                  <th className="py-3 px-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                    Storage (est.)
                  </th>
                  <th className="py-3 px-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/10">
                    <td className="py-3 px-4 text-sm text-[var(--white)]/90">
                      {r.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--grey)] font-mono">
                      {r.slug}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.profileStatus === "Complete"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {r.profileStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--white)]/80">
                      {r.adminEmail}
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--grey)]">
                      {r.storageEstimate} MB ({r.designCount} designs)
                    </td>
                    <td className="py-3 px-4 flex flex-wrap gap-2">
                      <Link
                        href={`/${r.slug}/settings`}
                        className="inline-flex items-center rounded-[var(--radius)] border border-white/20 bg-[var(--bg)] px-3 py-1.5 text-xs font-medium text-[var(--white)]/90 hover:bg-white/10 transition"
                      >
                        Edit Branding
                      </Link>
                      <Link
                        href={`/${r.slug}`}
                        className="inline-flex items-center rounded-[var(--radius)] border border-[var(--gold)]/40 bg-[var(--gold-dim)] px-3 py-1.5 text-xs font-medium text-[var(--gold)] hover:bg-[var(--gold-glow)] hover:text-[var(--white)] transition"
                      >
                        Open portal
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
