import { createClient } from "@/utils/supabase/server";
import AdminDesignRow from "./AdminDesignRow";
import AdminMaintenance from "./AdminMaintenance";

export const metadata = {
  title: "Admin | InkMind",
  description: "Admin dashboard for tattoo studio management.",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.id) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role, studio_id")
    .eq("id", authUser.id)
    .single();

  const isAdmin = profile?.is_admin || profile?.role === "SUPER_ADMIN";
  if (!isAdmin) {
    return null;
  }

  const studioId = profile?.studio_id ?? null;
  const { data: designs } = studioId
    ? await supabase
        .from("designs")
        .select("id, prompt, image_url, status, created_at")
        .eq("studio_id", studioId)
        .order("created_at", { ascending: false })
    : { data: [] as { id: string; prompt: string | null; image_url: string | null; status: string; created_at: string }[] };

  const list = designs ?? [];

  return (
    <>
      <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)] animate-spring-in">
        Studio Dashboard
      </h1>
      <p className="mt-2 text-[var(--grey)] animate-spring-in">
        Designs for your studio. Mark deposit received to unlock high-res download for the client.
      </p>

      <section className="mt-8 animate-spring-in">
        <AdminMaintenance />
      </section>

      <div className="mt-8 premium-card p-0 overflow-visible">
        <div className="overflow-x-auto">
        {list.length === 0 ? (
          <div className="p-8 text-center text-[var(--grey)]">
            No designs yet. When clients save designs from your studio, they will appear here.
          </div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="py-3 pr-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                  Client Email
                </th>
                <th className="py-3 pr-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                  AI Prompt
                </th>
                <th className="py-3 pr-4 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                  Image
                </th>
                <th className="py-3 text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
                  Deposit
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <AdminDesignRow
                  key={d.id}
                  design={{
                    id: d.id,
                    prompt: d.prompt ?? "",
                    imageUrl: d.image_url ?? "",
                    isPaid: false,
                    clientEmail: null,
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>
    </>
  );
}
