import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Debug | InkMind",
  description: "Diagnostic portal (hidden).",
};

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg)] p-8 text-[var(--white)]">
        <h1 className="text-xl font-semibold">Debug</h1>
        <p className="mt-4 text-[var(--grey)]">Not logged in. Sign in to see diagnostics.</p>
        <Link href="/login" className="mt-4 inline-block text-[var(--gold)] hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  let profile: { id: string; is_admin: boolean; role: string | null; studio_id: string | null; studios?: { slug: string; name: string } | null } | null = null;
  let designCount = 0;
  let dbError: string | null = null;

  try {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("id, is_admin, role, studio_id, studios ( slug, name )")
      .eq("id", authUser.id)
      .single();
    profile = profileRow as typeof profile;

    const isSuperAdmin = profile?.is_admin === true;
    if (isSuperAdmin) {
      const { count } = await supabase.from("designs").select("id", { count: "exact", head: true });
      designCount = count ?? 0;
    } else {
      const { count } = await supabase.from("designs").select("id", { count: "exact", head: true }).eq("profile_id", authUser.id);
      designCount = count ?? 0;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    dbError = message;
  }

  if (dbError) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg)] p-8 text-[var(--white)]">
        <h1 className="text-xl font-semibold text-[var(--gold)]">Debug</h1>
        <p className="mt-4 text-[var(--grey)]">You are signed in, but the database could not be reached.</p>
        <div className="mt-4 rounded-[var(--radius)] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 max-w-xl">
          {dbError}
        </div>
        <p className="mt-4 text-sm text-[var(--grey)]">
          Set <code className="font-mono text-[var(--white)]/80">DATABASE_URL</code> in <code className="font-mono text-[var(--white)]/80">.env.local</code> to a valid PostgreSQL connection string (e.g. from Supabase Dashboard → Project Settings → Database).
        </p>
        <Link href="/" className="mt-6 inline-block text-[var(--gold)] hover:underline">
          Back to app
        </Link>
      </div>
    );
  }

  const isSuperAdmin = profile?.is_admin === true;
  const role = isSuperAdmin ? "SUPER_ADMIN" : (profile?.role ?? "USER");
  const studioSlug = profile?.studios?.slug ?? null;
  const studioName = profile?.studios?.name ?? null;

  return (
    <div
      className="min-h-[100dvh] bg-[var(--bg)] p-8 text-[var(--white)]"
      style={{
        paddingLeft: "calc(2rem + var(--safe-left))",
        paddingRight: "calc(2rem + var(--safe-right))",
        paddingBottom: "calc(2rem + var(--safe-bottom))",
      }}
    >
      <h1 className="text-xl font-semibold text-[var(--gold)]">Diagnostic Portal</h1>
      <p className="mt-1 text-sm text-[var(--grey)]">Hidden debug page — verify auth and data at a glance.</p>

      <section className="mt-8 rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-6 max-w-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--grey)] mb-4">
          Current user
        </h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-[var(--grey)]">Email</dt>
            <dd className="font-mono text-[var(--white)]/90">{authUser.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--grey)]">Id</dt>
            <dd className="font-mono text-[var(--white)]/80 break-all">{authUser.id}</dd>
          </div>
          <div>
            <dt className="text-[var(--grey)]">Role</dt>
            <dd className="font-mono text-[var(--white)]/90">{role}</dd>
          </div>
          <div>
            <dt className="text-[var(--grey)]">Studio (profile)</dt>
            <dd className="font-mono text-[var(--white)]/80">
              {profile?.studio_id ?? "—"}
              {studioName && (
                <span className="block text-[var(--grey)] mt-0.5">
                  {studioName} ({studioSlug})
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-6 max-w-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--grey)] mb-4">
          Test query
        </h2>
        <p className="text-sm text-[var(--white)]/90">
          <strong>designs.count()</strong> — {isSuperAdmin ? "global total" : "my designs only"}:{" "}
          <span className="font-mono text-[var(--gold)]">{designCount.toLocaleString()}</span>
        </p>
      </section>

      <section className="mt-6 max-w-2xl">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--grey)] mb-3">
          Quick links
        </h2>
        <ul className="flex flex-wrap gap-3">
          <li>
            <Link
              href="/admin/super/studios"
              className="inline-flex rounded-[var(--radius)] border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--white)] hover:bg-white/10 transition"
            >
              Go to Super Admin
            </Link>
          </li>
          <li>
            {studioSlug ? (
              <Link
                href={`/${studioSlug}`}
                className="inline-flex rounded-[var(--radius)] border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--white)] hover:bg-white/10 transition"
              >
                Go to My Studio
              </Link>
            ) : (
              <span className="inline-flex rounded-[var(--radius)] border border-white/10 bg-white/5 px-4 py-2 text-sm text-[var(--grey)]">
                Go to My Studio (no studio)
              </span>
            )}
          </li>
          <li>
            <Link
              href="/"
              className="inline-flex rounded-[var(--radius)] border border-[var(--gold)]/40 bg-[var(--gold-dim)] px-4 py-2 text-sm font-medium text-[var(--gold)] hover:bg-[var(--gold-glow)] hover:text-[var(--white)] transition"
            >
              Go to Creator
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
