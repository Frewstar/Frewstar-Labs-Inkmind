import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminStorageMeter from "./AdminStorageMeter";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.id) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_admin, role")
    .eq("id", authUser.id)
    .single();

  const isAdmin = profile?.is_admin || profile?.role === "SUPER_ADMIN";
  if (!profile || !isAdmin) {
    redirect("/");
  }

  return (
    <div
      className="flex min-h-[100dvh]"
      style={{
        background: "var(--bg)",
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      <aside
        className="w-56 shrink-0 border-r border-white/10 bg-[var(--bg-card)]"
        style={{ paddingLeft: "var(--safe-left)" }}
      >
        <div className="sticky top-0 flex flex-col gap-6 py-6 pl-4 pr-4">
          <Link
            href="/admin"
            className="font-[var(--font-head)] text-lg font-semibold text-[var(--white)] hover:text-[var(--gold)] transition"
          >
            Admin
          </Link>
          <AdminStorageMeter />
          <nav className="flex flex-col gap-1">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
              Studio Management
            </p>
            <Link
              href="/admin/pending-designs"
              className="rounded-[var(--radius)] px-3 py-2 text-sm text-[var(--white)]/90 hover:bg-white/5 hover:text-[var(--gold)] transition"
            >
              Pending Designs
            </Link>
            <Link
              href="/admin/client-bookings"
              className="rounded-[var(--radius)] px-3 py-2 text-sm text-[var(--white)]/90 hover:bg-white/5 hover:text-[var(--gold)] transition"
            >
              Client Bookings
            </Link>
            <Link
              href="/admin/designs"
              className="rounded-[var(--radius)] px-3 py-2 text-sm text-[var(--white)]/90 hover:bg-white/5 hover:text-[var(--gold)] transition"
            >
              All Designs
            </Link>
            <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
              Super Admin
            </p>
            <Link
              href="/admin/super/studios"
              className="rounded-[var(--radius)] px-3 py-2 text-sm text-[var(--white)]/90 hover:bg-white/5 hover:text-[var(--gold)] transition"
            >
              Studio Management
            </Link>
          </nav>
          <Link
            href="/"
            className="mt-auto pt-4 text-sm text-[var(--grey)] hover:text-[var(--gold)] transition"
          >
            Back to app
          </Link>
        </div>
      </aside>
      <main
        className="min-h-[100dvh] flex-1 overflow-auto px-6 py-8"
        style={{
          paddingRight: "calc(1.5rem + var(--safe-right))",
          paddingLeft: "1.5rem",
        }}
      >
        {children}
      </main>
    </div>
  );
}
