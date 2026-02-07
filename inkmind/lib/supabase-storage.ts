import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Parse Supabase storage public URL into bucket and path.
 * e.g. https://xxx.supabase.co/storage/v1/object/public/generated-designs/uuid/file.png
 *   -> { bucket: "generated-designs", path: "uuid/file.png" }
 */
export function parseSupabaseStorageUrl(
  url: string
): { bucket: string; path: string } | null {
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
 * Resolve a design image URL using Supabase's getPublicUrl helper.
 * - If the URL is already a full Supabase storage URL (http/https), return as-is so the image loads
 *   without being altered (avoids blank images from re-building the URL).
 * - If the URL is path-only (e.g. "generated-designs/userId/file.png"), build full URL with current supabase.
 */
export function resolveStorageUrl(
  supabase: SupabaseClient,
  url: string | null | undefined
): string | null {
  const raw = typeof url === "string" ? url.trim() : "";
  if (!raw) return null;
  const parsed = parseSupabaseStorageUrl(raw);
  if (parsed) {
    // Already a full storage URL — return as-is so we don't risk breaking it
    return raw;
  }
  // Path-only stored in DB? e.g. "generated-designs/abc/file.png"
  const pathMatch = raw.match(/^([^/]+)\/(.+)$/);
  if (pathMatch) {
    const [, bucket, path] = pathMatch;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
  return raw;
}
