import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/db";
import DesignGalleryClient from "./DesignGalleryClient";

/**
 * Server Component: fetches the current user's designs using server-side Supabase + Prisma.
 * Passes data as props to DesignGalleryClient (no server code in client bundle).
 */
export default async function DesignGalleryServer() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.id) {
    return <DesignGalleryClient designs={[]} unauthenticated />;
  }

  let rows: Awaited<ReturnType<typeof prisma.designs.findMany>>;
  try {
    rows = await prisma.designs.findMany({
      where: { profile_id: authUser.id },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        prompt: true,
        image_url: true,
        reference_image_url: true,
        status: true,
        is_starred: true,
        created_at: true,
      },
    });
  } catch (err) {
    // Database unreachable: wrong DATABASE_URL, Supabase paused (free tier), network, or Postgres down
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Design gallery: database unreachable —", msg);
    return (
      <DesignGalleryClient
        designs={[]}
        dbError="We couldn't connect to the database. If you use Supabase, check that the project isn't paused (free tier pauses after inactivity). Otherwise verify DATABASE_URL in .env and that the database is running."
      />
    );
  }

  const designs = rows.map((d) => ({
    id: d.id,
    prompt: d.prompt ?? "",
    imageUrl: d.image_url ?? "",
    referenceImageUrl: d.reference_image_url ?? null,
    status: d.status,
    isStarred: d.is_starred,
    createdAt: d.created_at.toISOString(),
    isPaid: false,
  }));

  return <DesignGalleryClient designs={designs} />;
}
