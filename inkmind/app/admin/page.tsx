import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/db";
import AdminDesignRow from "./AdminDesignRow";
import AdminMaintenance from "./AdminMaintenance";

export const metadata = {
  title: "Admin | InkMind",
  description: "Admin dashboard for tattoo studio management.",
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return null;
  }

  const admin = await prisma.user.findFirst({
    where: { email: authUser.email, isAdmin: true },
  });

  if (!admin) {
    return null;
  }

  const designs = await prisma.design.findMany({
    where: {
      studio: { ownerId: admin.id },
    },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { email: true } },
      studio: { select: { name: true } },
    },
  });

  return (
    <>
      <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)]">
        Studio Dashboard
      </h1>
      <p className="mt-2 text-[var(--grey)]">
        Designs for studios you own. Mark deposit received to unlock high-res download for the client.
      </p>

      <section className="mt-8">
        <AdminMaintenance />
      </section>

      <div className="mt-8 overflow-x-auto rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)]">
        {designs.length === 0 ? (
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
              {designs.map((d) => (
                <AdminDesignRow
                  key={d.id}
                  design={{
                    id: d.id,
                    prompt: d.prompt,
                    imageUrl: d.imageUrl,
                    isPaid: d.isPaid,
                    clientEmail: d.client?.email ?? null,
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
