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

  const prismaUser = await prisma.user.findFirst({
    where: {
      OR: [{ authId: authUser.id }, { email: authUser.email ?? undefined }],
    },
  });

  if (!prismaUser) {
    return <DesignGalleryClient designs={[]} noAccount />;
  }

  const rows = await prisma.design.findMany({
    where: { clientId: prismaUser.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      prompt: true,
      imageUrl: true,
      status: true,
      createdAt: true,
      isPaid: true,
    },
  });

  const designs = rows.map((d) => ({
    id: d.id,
    prompt: d.prompt,
    imageUrl: d.imageUrl,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    isPaid: d.isPaid,
  }));

  return <DesignGalleryClient designs={designs} />;
}
