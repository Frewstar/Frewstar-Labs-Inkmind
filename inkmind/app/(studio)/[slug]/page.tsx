import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getStorageUsage } from "@/app/admin/actions";
import { STORAGE_LIMIT_BYTES } from "@/app/admin/constants";
import StudioAdminDashboard from "./StudioAdminDashboard";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const studio = await prisma.studios.findUnique({
    where: { slug },
    select: { name: true },
  });
  return {
    title: studio ? `${studio.name} | Studio Admin | InkMind` : "Studio Admin | InkMind",
  };
}

export default async function StudioAdminPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    redirect("/login");
  }

  const studio = await prisma.studios.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });

  if (!studio) {
    notFound();
  }

  const [designs, studioUsers, storage] = await Promise.all([
    prisma.designs.findMany({
      where: { studio_id: studio.id },
      orderBy: { created_at: "desc" },
      include: {
        profiles: {
          include: {
            users: { select: { email: true } },
          },
        },
      },
    }),
    prisma.designs
      .findMany({
        where: { studio_id: studio.id },
        select: { profile_id: true },
        distinct: ["profile_id"],
      })
      .then((rows) =>
        prisma.profiles.findMany({
          where: { id: { in: rows.map((r) => r.profile_id) } },
          include: {
            users: { select: { email: true } },
          },
        })
      ),
    getStorageUsage(studio.id),
  ]);

  const storageEstimateBytes = storage.totalBytes;
  const storagePercent = Math.min(100, (storageEstimateBytes / STORAGE_LIMIT_BYTES) * 100);

  const designItems = designs.map((d) => ({
    id: d.id,
    prompt: d.prompt ?? "",
    imageUrl: d.image_url ?? null,
    referenceImageUrl: d.reference_image_url ?? null,
    status: d.status,
    createdAt: d.created_at.toISOString(),
    userEmail: d.profiles?.users?.email ?? null,
  }));

  const userList = studioUsers.map((p) => ({
    id: p.id,
    email: p.users?.email ?? null,
    designCount: 0, // we can aggregate in a follow-up if needed
  }));

  return (
    <StudioAdminDashboard
      studio={{ id: studio.id, name: studio.name, slug: studio.slug }}
      designs={designItems}
      users={userList}
      storageEstimateBytes={storageEstimateBytes}
      storageLimitBytes={STORAGE_LIMIT_BYTES}
      storagePercent={storagePercent}
    />
  );
}
