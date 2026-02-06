import { resolveStorageUrl } from "@/lib/supabase-storage";
import { createClient } from "@/utils/supabase/server";
import AdminDesignsList from "../AdminDesignsList";

export const metadata = {
  title: "All Designs | Admin | InkMind",
  description: "View and manage every tattoo design and reference image.",
};

type PageProps = {
  searchParams: Promise<{ query?: string }> | { query?: string };
};

export default async function AdminDesignsPage({ searchParams }: PageProps) {
  const resolved = await Promise.resolve(searchParams);
  const query = (resolved.query ?? "").trim();
  const supabase = await createClient();

  let q = supabase
    .from("designs")
    .select("id, prompt, image_url, reference_image_url, status, created_at, profile_id, studio_id, studios ( name )")
    .order("created_at", { ascending: false });

  if (query.length > 0) {
    q = q.ilike("prompt", `%${query}%`);
  }

  const { data: designs } = await q;

  const items = (designs ?? []).map((d) => ({
    id: d.id,
    prompt: d.prompt ?? "",
    imageUrl: resolveStorageUrl(supabase, d.image_url) ?? null,
    referenceImageUrl: resolveStorageUrl(supabase, d.reference_image_url) ?? null,
    status: d.status,
    createdAt: new Date(d.created_at).toISOString(),
    userEmail: null as string | null,
    studioName: (d.studios as { name: string } | null)?.name ?? null,
  }));

  return (
    <>
      <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)]">
        All Designs
      </h1>
      <p className="mt-2 text-[var(--grey)]">
        Every tattoo generated and every reference image. Delete removes the record and the file from storage.
      </p>

      <AdminDesignsList designs={items} initialQuery={query} />
    </>
  );
}
