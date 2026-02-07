import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { resolveStorageUrl } from "@/lib/supabase-storage";
import { getStorageUsage } from "@/app/admin/actions";
import { STORAGE_LIMIT_BYTES } from "@/app/admin/constants";
import StudioCreatorSlot from "./StudioCreatorSlot";
import StudioAdminDashboard from "./StudioAdminDashboard";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: studio } = await supabase
    .from("studios")
    .select("name")
    .eq("slug", slug)
    .single();

  return {
    title: studio ? `${studio.name} | Studio Admin | InkMind` : "Studio Admin | InkMind",
  };
}

export default async function StudioAdminPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    redirect("/login");
  }

  const { data: studio, error: studioError } = await supabase
    .from("studios")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (studioError || !studio) {
    notFound();
  }

  const [designsResult, distinctProfilesResult, storage] = await Promise.all([
    supabase
      .from("designs")
      .select("id, prompt, image_url, reference_image_url, final_image_url, status, created_at, profile_id, submitted_at, ross_reasoning")
      .eq("studio_id", studio.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("designs")
      .select("profile_id")
      .eq("studio_id", studio.id)
      .then(async (r) => {
        if (r.error || !r.data?.length) return { data: [] as { id: string; email: string | null }[] };
        const profileIds = [...new Set(r.data.map((d) => d.profile_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .in("id", profileIds);
        return {
          data: (profiles ?? []).map((p) => ({ id: p.id, email: null })),
        };
      }),
    getStorageUsage(studio.id),
  ]);

  const designs = designsResult.data ?? [];
  const studioUsers = distinctProfilesResult.data ?? [];

  const storageEstimateBytes = storage.totalBytes;
  const storagePercent = Math.min(100, (storageEstimateBytes / STORAGE_LIMIT_BYTES) * 100);

  const designItems = designs.map((d) => ({
    id: d.id,
    prompt: d.prompt ?? "",
    imageUrl: resolveStorageUrl(supabase, d.image_url) ?? null,
    referenceImageUrl: resolveStorageUrl(supabase, d.reference_image_url) ?? null,
    finalImageUrl: resolveStorageUrl(supabase, d.final_image_url) ?? null,
    status: d.status,
    createdAt: new Date(d.created_at).toISOString(),
    userEmail: null,
    submittedAt: d.submitted_at ? new Date(d.submitted_at).toISOString() : null,
    rossReasoning: d.ross_reasoning ?? null,
  }));

  const userList = studioUsers.map((p) => ({
    id: p.id,
    email: p.email ?? null,
    designCount: 0,
  }));

  return (
    <>
      <StudioCreatorSlot studioSlug={studio.slug} studioId={studio.id} />
      <StudioAdminDashboard
        studio={{ id: studio.id, name: studio.name, slug: studio.slug }}
        designs={designItems}
        users={userList}
        storageEstimateBytes={storageEstimateBytes}
        storageLimitBytes={STORAGE_LIMIT_BYTES}
        storagePercent={storagePercent}
      />
    </>
  );
}
