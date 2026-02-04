"use server";

import prisma from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

function parseSupabaseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const u = new URL(url);
    const match = u.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (!match) return null;
    return { bucket: match[1], path: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

/**
 * Delete the current user's design: remove files from Supabase Storage first, then delete the Prisma record.
 * Checks both image_url and reference_image_url; parses bucket + path and calls storage.remove().
 * Only after storage is cleaned do we delete the record to avoid orphan files in the bucket.
 * Only allowed if design.profile_id === current auth user id.
 */
export async function deleteMyDesign(designId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return { error: "Unauthorized" };
    }

    const design = await prisma.designs.findUnique({
      where: { id: designId },
      select: { profile_id: true, reference_image_url: true, image_url: true },
    });

    if (!design || design.profile_id !== authUser.id) {
      return { error: "Design not found or you don't have permission to delete it" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const toRemove: { bucket: string; path: string }[] = [];

    if (design.reference_image_url && baseUrl && design.reference_image_url.startsWith(baseUrl)) {
      const ref = parseSupabaseStorageUrl(design.reference_image_url);
      if (ref) toRemove.push(ref);
    }
    if (design.image_url && baseUrl && design.image_url.startsWith(baseUrl)) {
      const img = parseSupabaseStorageUrl(design.image_url);
      if (img) toRemove.push(img);
    }

    for (const { bucket, path } of toRemove) {
      await supabase.storage.from(bucket).remove([path]);
    }

    // Only after storage cleanup to avoid orphan images
    await prisma.designs.delete({
      where: { id: designId },
    });

    revalidatePath("/");
    return {};
  } catch (e) {
    console.error("[InkMind] deleteMyDesign error:", e);
    return { error: e instanceof Error ? e.message : "Delete failed" };
  }
}

/**
 * Toggle the is_starred (favorite) flag for the current user's design.
 */
export async function toggleFavorite(designId: string): Promise<{ error?: string; isStarred?: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return { error: "Unauthorized" };
    }

    const design = await prisma.designs.findUnique({
      where: { id: designId },
      select: { profile_id: true, is_starred: true },
    });

    if (!design || design.profile_id !== authUser.id) {
      return { error: "Design not found or you don't have permission to change it" };
    }

    const nextStarred = !design.is_starred;
    await prisma.designs.update({
      where: { id: designId },
      data: { is_starred: nextStarred },
    });

    revalidatePath("/");
    return { isStarred: nextStarred };
  } catch (e) {
    console.error("[InkMind] toggleFavorite error:", e);
    return { error: e instanceof Error ? e.message : "Toggle failed" };
  }
}
