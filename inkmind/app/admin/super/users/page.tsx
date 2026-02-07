import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import UserRoleManager from "./UserRoleManager";

export const metadata = {
  title: "User Management | Super Admin | InkMind",
  description: "Manage user roles and permissions.",
};

export default async function SuperUsersPage() {
  const supabase = await createClient();

  const [profilesRes, studiosRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(`
        id,
        role,
        is_admin,
        studio_id,
        studios:studio_id (
          name,
          slug
        )
      `)
      .order("role", { ascending: false }),
    supabase.from("studios").select("id, name, slug").order("name", { ascending: true }),
  ]);

  const profiles = profilesRes.data ?? [];
  const studios = (studiosRes.data ?? []).map((s) => ({ id: s.id, name: s.name, slug: s.slug }));

  const users = profiles.map((p: { id: string; role: string | null; is_admin: boolean; studio_id: string | null; studios?: { name: string; slug: string } | null }) => ({
    id: p.id,
    email: "—", // Email not accessible from profiles table
    role: p.role ?? (p.is_admin ? "SUPER_ADMIN" : "USER"),
    studioId: p.studio_id ?? null,
    studioName: p.studios?.name ?? null,
    studioSlug: p.studios?.slug ?? null,
  }));

  const superAdmins = users.filter((u) => u.role === "SUPER_ADMIN");
  const studioAdmins = users.filter((u) => u.role === "STUDIO_ADMIN");
  const regularUsers = users.filter((u) => u.role === "USER");

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
          User Management
        </h1>
        <p className="mt-1 text-sm text-[var(--grey)]">
          Manage user roles and studio assignments.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
            Super Admins
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--gold)]">
            {superAdmins.length}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
            Studio Admins
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--gold)]">
            {studioAdmins.length}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
            Regular Users
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--white)]">
            {regularUsers.length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-[var(--white)]">All Users</h2>
        </div>
        
        {users.length === 0 ? (
          <div className="p-8 text-center text-[var(--grey)] text-sm">
            No users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr className="text-left">
                  <th className="py-3 px-5 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                    User ID
                  </th>
                  <th className="py-3 px-5 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                    Role
                  </th>
                  <th className="py-3 px-5 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                    Studio
                  </th>
                  <th className="py-3 px-5 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-5">
                      <p className="text-xs font-mono text-[var(--white)]/70 truncate max-w-[200px]">
                        {u.id}
                      </p>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-[var(--radius)] text-xs font-semibold ${
                          u.role === "SUPER_ADMIN"
                            ? "bg-purple-500/20 text-purple-300"
                            : u.role === "STUDIO_ADMIN"
                            ? "bg-[var(--gold)]/20 text-[var(--gold)]"
                            : "bg-white/10 text-[var(--grey)]"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      {u.studioSlug ? (
                        <Link
                          href={`/${u.studioSlug}`}
                          className="text-sm text-[var(--gold)] hover:underline"
                        >
                          {u.studioName}
                        </Link>
                      ) : (
                        <span className="text-sm text-[var(--grey)]">—</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <UserRoleManager
                        userId={u.id}
                        currentRole={u.role}
                        currentStudioId={u.studioId}
                        studios={studios}
                      />
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
