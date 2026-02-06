import { resolveStorageUrl } from "@/lib/supabase-storage";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import DesignGallery from "./DesignGallery";

export const metadata = {
  title: "All Designs | Super Admin | InkMind",
  description: "View and manage all platform designs.",
};

export default async function SuperDesignsPage() {
  const supabase = await createClient();

  const { data: designs } = await supabase
    .from("designs")
    .select(`
      id,
      prompt,
      image_url,
      status,
      created_at,
      studio_id,
      studios:studio_id (
        name,
        slug
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const designItems = (designs ?? []).map((d) => ({
    id: d.id,
    prompt: d.prompt || "",
    imageUrl: resolveStorageUrl(supabase, d.image_url) ?? "",
    status: d.status,
    createdAt: d.created_at,
    studioName: d.studios?.name ?? "Unknown",
    studioSlug: d.studios?.slug ?? null,
  }));

  const totalDesigns = designItems.length;
  const pendingCount = designItems.filter((d) => d.status === "pending").length;
  const approvedCount = designItems.filter((d) => d.status === "approved").length;

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
          All Platform Designs
        </h1>
        <p className="mt-1 text-sm text-[var(--grey)]">
          View and manage designs across all studios.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
            Total Designs
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--white)]">
            {totalDesigns}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
            Pending Review
          </p>
          <p className="mt-2 text-3xl font-semibold text-amber-400">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
            Approved
          </p>
          <p className="mt-2 text-3xl font-semibold text-emerald-400">
            {approvedCount}
          </p>
        </div>
      </div>

      {/* Design Gallery */}
      <DesignGallery designs={designItems} />
    </div>
  );
}
