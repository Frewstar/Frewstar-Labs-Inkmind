"use server";

import { randomUUID } from "crypto";
import prisma from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const STORAGE_BUCKETS = ["reference-images", "generated-designs"] as const;

/**
 * Fetch total bytes used by reference-images and generated-designs via get_storage_usage RPC.
 * When studioId is provided, only counts objects with metadata.studio_id = studioId (scoped).
 * When omitted, returns global total. Used by AdminStorageMeter and studio dashboard.
 * If the RPC is not deployed (migration 004/006 not run), returns 0 without throwing.
 */
export async function getStorageUsage(studioId?: string | null): Promise<{ totalBytes: number }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_storage_usage", {
      bucket_ids: [...STORAGE_BUCKETS],
      target_studio_id: studioId ?? null,
    });
    if (error) {
      // RPC may be missing if supabase migrations 004/006 were not applied; fail silently so admin still loads
      if (process.env.NODE_ENV === "development" && (error.message || error.code)) {
        console.warn("[admin] get_storage_usage RPC:", error.message || error.code, "— run migrations 004 & 006 if you need the storage meter.");
      }
      return { totalBytes: 0 };
    }
    const totalBytes = typeof data === "number" ? data : Number(data ?? 0);
    return { totalBytes: Number.isFinite(totalBytes) ? totalBytes : 0 };
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[admin] getStorageUsage:", e instanceof Error ? e.message : "RPC failed");
    }
    return { totalBytes: 0 };
  }
}

/**
 * Parse Supabase storage public URL into bucket and path for delete.
 * e.g. https://xxx.supabase.co/storage/v1/object/public/reference-images/uuid/file.png -> { bucket: "reference-images", path: "uuid/file.png" }
 */
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

/**
 * Delete a design: remove files from Supabase Storage first, then delete the Prisma record.
 * Checks both image_url and reference_image_url; parses bucket + path and calls storage.remove().
 * Only after storage is cleaned do we call prisma.designs.delete() to avoid orphan files.
 * Admin only. Used by admin/designs page.
 */
export async function deleteDesign(designId: string): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return { error: "Unauthorized" };
    }

    const profile = await prisma.profiles.findUnique({
      where: { id: authUser.id },
      select: { is_admin: true },
    });

    if (!profile?.is_admin) {
      return { error: "Forbidden" };
    }

    const design = await prisma.designs.findUnique({
      where: { id: designId },
      select: { reference_image_url: true, image_url: true },
    });

    if (!design) {
      return { error: "Design not found" };
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

    // Only after storage cleanup to avoid orphan images in the bucket
    await prisma.designs.delete({
      where: { id: designId },
    });

    revalidatePath("/admin/designs");
    revalidatePath("/admin");
    return {};
  } catch (e) {
    console.error("[InkMind] deleteDesign error:", e);
    return { error: e instanceof Error ? e.message : "Delete failed" };
  }
}

/**
 * Toggle the is_starred (favorite) flag for a design. Admin only.
 */
export async function toggleFavorite(designId: string): Promise<{ error?: string; isStarred?: boolean }> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return { error: "Unauthorized" };
    }

    const profile = await prisma.profiles.findUnique({
      where: { id: authUser.id },
      select: { is_admin: true },
    });

    if (!profile?.is_admin) {
      return { error: "Forbidden" };
    }

    const design = await prisma.designs.findUnique({
      where: { id: designId },
      select: { is_starred: true },
    });

    if (!design) {
      return { error: "Design not found" };
    }

    const nextStarred = !design.is_starred;
    await prisma.designs.update({
      where: { id: designId },
      data: { is_starred: nextStarred },
    });

    revalidatePath("/admin/designs");
    revalidatePath("/admin");
    return { isStarred: nextStarred };
  } catch (e) {
    console.error("[InkMind] toggleFavorite error:", e);
    return { error: e instanceof Error ? e.message : "Toggle failed" };
  }
}

const PURGE_DAYS = 30;
const ESTIMATE_BYTES_PER_WEBP = 400 * 1024; // 400 KB per image for dry-run size estimate

function formatSizeEstimate(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export type PurgeOldDesignsResult =
  | { error: string }
  | { count: number; totalSizeEstimate: string; mode: "dry-run" | "live" };

/**
 * Auto-purge: delete non-favorite designs older than 30 days.
 * Removes files from Supabase Storage first, then deletes records with prisma.designs.deleteMany.
 * Secured by CRON_SECRET. Supports dry run (default) to only count and estimate size.
 */
export async function purgeOldDesigns(
  cronSecret: string,
  isDryRun: boolean = true
): Promise<PurgeOldDesignsResult> {
  const expected = process.env.CRON_SECRET;
  if (!expected || cronSecret !== expected) {
    return { error: "Unauthorized" };
  }

  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PURGE_DAYS);

    const designs = await prisma.designs.findMany({
      where: {
        is_starred: false,
        created_at: { lt: cutoff },
      },
      select: { image_url: true, reference_image_url: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const byBucket = new Map<string, string[]>();
    let fileCount = 0;

    for (const d of designs) {
      if (d.reference_image_url && baseUrl && d.reference_image_url.startsWith(baseUrl)) {
        const ref = parseSupabaseStorageUrl(d.reference_image_url);
        if (ref) {
          const paths = byBucket.get(ref.bucket) ?? [];
          paths.push(ref.path);
          byBucket.set(ref.bucket, paths);
          fileCount += 1;
        }
      }
      if (d.image_url && baseUrl && d.image_url.startsWith(baseUrl)) {
        const img = parseSupabaseStorageUrl(d.image_url);
        if (img) {
          const paths = byBucket.get(img.bucket) ?? [];
          paths.push(img.path);
          byBucket.set(img.bucket, paths);
          fileCount += 1;
        }
      }
    }

    const totalSizeEstimate = formatSizeEstimate(fileCount * ESTIMATE_BYTES_PER_WEBP);

    if (isDryRun) {
      return {
        count: designs.length,
        totalSizeEstimate,
        mode: "dry-run",
      };
    }

    const supabase = await createClient();
    for (const [bucket, paths] of byBucket) {
      await supabase.storage.from(bucket).remove(paths);
    }

    const result = await prisma.designs.deleteMany({
      where: {
        is_starred: false,
        created_at: { lt: cutoff },
      },
    });

    revalidatePath("/admin/designs");
    revalidatePath("/admin");
    return {
      count: result.count,
      totalSizeEstimate,
      mode: "live",
    };
  } catch (e) {
    console.error("[InkMind] purgeOldDesigns error:", e);
    return { error: e instanceof Error ? e.message : "Purge failed" };
  }
}

/**
 * Fetch profiles for Super Admin dropdown (id + email). Optional search by email.
 */
export async function getProfilesForStudioAdmin(search?: string): Promise<{ id: string; email: string | null }[]> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser?.id) return [];

  const profile = await prisma.profiles.findUnique({
    where: { id: authUser.id },
    select: { is_admin: true, role: true },
  });
  const isSuperAdmin = profile?.is_admin || profile?.role === "SUPER_ADMIN";
  if (!isSuperAdmin) return [];

  const where = search?.trim()
    ? { users: { email: { contains: search.trim(), mode: "insensitive" as const } } }
    : {};
  const profiles = await prisma.profiles.findMany({
    where: Object.keys(where).length ? where : undefined,
    take: 50,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      users: { select: { email: true } },
    },
  });
  return profiles.map((p) => ({ id: p.id, email: p.users?.email ?? null }));
}

/**
 * Return current user's profile if they are a Super Admin (for "Use my account" in Create Studio).
 */
export async function getCurrentSuperAdminProfile(): Promise<{ id: string; email: string | null } | null> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser?.id) return null;

  const profile = await prisma.profiles.findUnique({
    where: { id: authUser.id },
    select: { id: true, is_admin: true, role: true, users: { select: { email: true } } },
  });
  const isSuperAdmin = profile?.is_admin || profile?.role === "SUPER_ADMIN";
  if (!profile || !isSuperAdmin) return null;
  return { id: profile.id, email: profile.users?.email ?? null };
}

/**
 * Super Admin: Create a studio and assign a profile as STUDIO_ADMIN.
 * Creates the Studio, then sets profile.role = 'STUDIO_ADMIN' and profile.studio_id = new studio id.
 */
export async function createStudioWithAdmin(
  name: string,
  slug: string,
  profileId: string
): Promise<{ error?: string; studioId?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) return { error: "Unauthorized" };

    const adminProfile = await prisma.profiles.findUnique({
      where: { id: authUser.id },
      select: { is_admin: true, role: true },
    });
    const isSuperAdmin = adminProfile?.is_admin || adminProfile?.role === "SUPER_ADMIN";
    if (!adminProfile || !isSuperAdmin) return { error: "Forbidden" };

    const trimmedName = (name ?? "").trim();
    const trimmedSlug = (slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "studio";
    if (!trimmedName) return { error: "Name is required" };

    const existing = await prisma.studios.findUnique({ where: { slug: trimmedSlug } });
    if (existing) return { error: "A studio with this slug already exists" };

    const profile = await prisma.profiles.findUnique({
      where: { id: profileId },
      select: { id: true },
    });
    if (!profile) return { error: "Selected profile not found" };

    const studio = await prisma.studios.create({
      data: { name: trimmedName, slug: trimmedSlug },
      select: { id: true },
    });

    await prisma.profiles.update({
      where: { id: profileId },
      data: { role: "STUDIO_ADMIN", studio_id: studio.id },
    });

    revalidatePath("/admin/super/studios");
    revalidatePath("/admin");
    return { studioId: studio.id };
  } catch (e) {
    console.error("[InkMind] createStudioWithAdmin error:", e);
    return { error: e instanceof Error ? e.message : "Failed to create studio" };
  }
}

export type UpdateStudioSettingsResult = { success?: boolean; error?: string };

/**
 * Update only the Ross / Artist Twin DNA fields. Used by StyleSettings.
 * Studio admins only; revalidates settings and studio routes.
 */
const STYLE_ADHERENCE_MIN = 1.5;
const STYLE_ADHERENCE_MAX = 5.0;

export async function updateStudioRossSettings(
  slug: string,
  values: {
    aiName: string;
    voiceTone: string;
    personality: string;
    specialties: string;
    styleAdherence?: number;
  }
): Promise<UpdateStudioSettingsResult> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) return { error: "You must be signed in." };

    const studio = await prisma.studios.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!studio) return { error: "Studio not found." };

    const profile = await prisma.profiles.findUnique({
      where: { id: authUser.id },
      select: { role: true, studio_id: true },
    });
    const isStudioAdmin =
      profile?.studio_id === studio.id && profile?.role === "STUDIO_ADMIN";
    if (!isStudioAdmin) return { error: "You do not have permission to edit this studio." };

    const ai_name = (values.aiName ?? "").trim() || null;
    const artist_voice_tone = (values.voiceTone ?? "").trim() || null;
    const ai_personality_prompt = (values.personality ?? "").trim() || null;
    const studio_specialties = (values.specialties ?? "")
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const rawAdherence = values.styleAdherence;
    const style_adherence =
      rawAdherence != null
        ? Math.min(
            STYLE_ADHERENCE_MAX,
            Math.max(STYLE_ADHERENCE_MIN, Number(rawAdherence))
          )
        : null;

    await prisma.studios.update({
      where: { id: studio.id },
      data: {
        ai_name,
        artist_voice_tone,
        ai_personality_prompt,
        studio_specialties,
        ...(style_adherence != null && { style_adherence }),
        updated_at: new Date(),
      },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/settings`);
    return { success: true };
  } catch (err) {
    console.error("[InkMind] updateStudioRossSettings error:", err);
    return { error: err instanceof Error ? err.message : "Failed to save." };
  }
}

/**
 * Update only the studio's Ross personality (e.g. after Style DNA extraction).
 * Fills the Personality textarea in Style Settings so Ross uses the extracted style guide.
 */
export async function updateStudioPersonality(
  slug: string,
  personality: string
): Promise<UpdateStudioSettingsResult> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) return { error: "You must be signed in." };

    const studio = await prisma.studios.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!studio) return { error: "Studio not found." };

    const profile = await prisma.profiles.findUnique({
      where: { id: authUser.id },
      select: { role: true, studio_id: true },
    });
    const isStudioAdmin =
      profile?.studio_id === studio.id && profile?.role === "STUDIO_ADMIN";
    if (!isStudioAdmin) return { error: "You do not have permission to edit this studio." };

    const ai_personality_prompt = (personality ?? "").trim() || null;

    await prisma.studios.update({
      where: { id: studio.id },
      data: { ai_personality_prompt, updated_at: new Date() },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/settings`);
    return { success: true };
  } catch (err) {
    console.error("[InkMind] updateStudioPersonality error:", err);
    return { error: err instanceof Error ? err.message : "Failed to save." };
  }
}

/**
 * Update studio contact/social settings. Only allowed if the current user is STUDIO_ADMIN for this studio.
 * Uses revalidatePath to refresh the studio dashboard and settings page.
 */
export async function updateStudioSettings(
  slug: string,
  formData: FormData
): Promise<UpdateStudioSettingsResult> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return { error: "You must be signed in to update studio settings." };
    }

    const studio = await prisma.studios.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!studio) {
      return { error: "Studio not found." };
    }

    const profile = await prisma.profiles.findUnique({
      where: { id: authUser.id },
      select: { role: true, studio_id: true },
    });

    const isStudioAdmin =
      profile?.studio_id === studio.id && profile?.role === "STUDIO_ADMIN";

    if (!isStudioAdmin) {
      return { error: "You do not have permission to edit this studio." };
    }

    const instagram_url = (formData.get("instagram_url") as string)?.trim() || null;
    const facebook_url = (formData.get("facebook_url") as string)?.trim() || null;
    const contact_email = (formData.get("contact_email") as string)?.trim() || null;
    const contact_phone = (formData.get("contact_phone") as string)?.trim() || null;
    const address = (formData.get("address") as string)?.trim() || null;
    const ai_name = (formData.get("ai_name") as string)?.trim() || null;
    const artist_voice_tone = (formData.get("artist_voice_tone") as string)?.trim() || null;
    const ai_personality_prompt = (formData.get("ai_personality_prompt") as string)?.trim() || null;

    const logoFile = formData.get("logo");
    let logo_url: string | null = null;
    if (logoFile && logoFile instanceof File && logoFile.size > 0) {
      const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
      const path = `logos/${studio.id}/logo.${ext === "jpg" ? "jpeg" : ext}`;
      const arrayBuffer = await logoFile.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);
      const contentType = logoFile.type || "image/png";
      const { error: uploadError } = await supabase.storage
        .from("studio-assets")
        .upload(path, buf, { contentType, upsert: true });
      if (uploadError) {
        console.error("[Studio Settings] logo upload error:", uploadError);
        return { error: uploadError.message || "Logo upload failed." };
      }
      const { data: urlData } = supabase.storage.from("studio-assets").getPublicUrl(path);
      logo_url = urlData.publicUrl;
    }

    const updateData: Parameters<typeof prisma.studios.update>[0]["data"] = {
      instagram_url,
      facebook_url,
      contact_email,
      contact_phone,
      address,
      updated_at: new Date(),
    };
    if (logo_url !== null) updateData.logo_url = logo_url;
    if (ai_name !== undefined) updateData.ai_name = ai_name;
    if (artist_voice_tone !== undefined) updateData.artist_voice_tone = artist_voice_tone;
    if (ai_personality_prompt !== undefined) updateData.ai_personality_prompt = ai_personality_prompt;

    await prisma.studios.update({
      where: { id: studio.id },
      data: updateData,
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/settings`);
    return { success: true };
  } catch (err) {
    console.error("[Studio Settings] updateStudioSettings error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to save settings.",
    };
  }
}

// ─── Studio portfolio (AI style references) ─────────────────────────────────

const PORTFOLIO_BUCKET = "studio-portfolios";
const PORTFOLIO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PORTFOLIO_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export type AddStudioPortfolioResult = { success?: boolean; error?: string };

/**
 * Upload an image to studio-portfolios bucket and save metadata to studio_portfolio.
 * Only studio admins for the given studio (by slug) can add entries.
 */
export async function addStudioPortfolioEntry(
  slug: string,
  formData: FormData
): Promise<AddStudioPortfolioResult> {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser?.id) {
      return { error: "You must be signed in to add portfolio entries." };
    }

    const studio = await prisma.studios.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!studio) return { error: "Studio not found." };

    const profile = await prisma.profiles.findUnique({
      where: { id: authUser.id },
      select: { role: true, studio_id: true },
    });
    const isStudioAdmin =
      profile?.studio_id === studio.id && profile?.role === "STUDIO_ADMIN";
    if (!isStudioAdmin) {
      return { error: "Only studio admins can add portfolio entries." };
    }

    const file = formData.get("file") ?? formData.get("image");
    if (!file || !(file instanceof File)) {
      return { error: "Please select an image (JPG, PNG or WebP)." };
    }
    if (!PORTFOLIO_ALLOWED_TYPES.includes(file.type)) {
      return { error: "Only JPG, PNG and WebP are allowed." };
    }
    if (file.size > PORTFOLIO_MAX_BYTES) {
      return { error: "Image must be under 10 MB." };
    }

    const title = (formData.get("title") as string)?.trim() || null;
    const styleTagsRaw = (formData.get("style_tags") as string)?.trim() || "";
    const style_tags = styleTagsRaw
      ? styleTagsRaw.split(/[\n,]+/).map((t) => t.trim()).filter(Boolean)
      : [];
    const technical_notes = (formData.get("technical_notes") as string)?.trim() || null;

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${studio.id}/${randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(PORTFOLIO_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
        metadata: { studio_id: studio.id },
      });

    if (uploadError) {
      console.error("[Portfolio] upload error:", uploadError);
      return { error: uploadError.message || "Upload failed. Ensure the studio-portfolios bucket exists." };
    }

    const { data: urlData } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(path);
    const image_url = urlData.publicUrl;

    // Run Ross Style Analysis on the uploaded image to generate "Style Instructions" DNA when none provided
    let notesToSave = technical_notes;
    if (!notesToSave?.trim()) {
      const { getRossStyleAnalysis } = await import("@/app/actions/ross");
      const analysis = await getRossStyleAnalysis(image_url);
      if (analysis.data?.trim()) notesToSave = analysis.data;
    }

    await prisma.studio_portfolio.create({
      data: {
        studio_id: studio.id,
        image_url,
        title,
        style_tags,
        technical_notes: notesToSave || null,
      },
    });

    revalidatePath(`/${slug}`);
    revalidatePath(`/${slug}/settings`);
    revalidatePath(`/${slug}/settings/portfolio`);
    return { success: true };
  } catch (err) {
    console.error("[Portfolio] addStudioPortfolioEntry error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to add portfolio entry.",
    };
  }
}
