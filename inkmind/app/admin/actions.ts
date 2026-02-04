"use server";

import prisma from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Mark a design as paid (deposit received). Only allowed for admin's studio designs.
 */
export async function markDesignPaid(designId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return { error: "Unauthorized" };
  }

  const admin = await prisma.user.findFirst({
    where: { email: authUser.email, isAdmin: true },
  });

  if (!admin) {
    return { error: "Forbidden" };
  }

  const design = await prisma.design.findFirst({
    where: { id: designId },
    include: { studio: true },
  });

  if (!design || design.studio.ownerId !== admin.id) {
    return { error: "Design not found or not in your studio" };
  }

  await prisma.design.update({
    where: { id: designId },
    data: { isPaid: true },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/pending-designs");
  revalidatePath("/");
  return {};
}
