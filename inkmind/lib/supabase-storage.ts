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
 * Ensures images work with both Supabase Cloud and Local (http://127.0.0.1:54321).
 * If the URL is a Supabase storage URL, parses bucket+path and reconstructs with
 * the current NEXT_PUBLIC_SUPABASE_URL. Otherwise returns the URL as-is.
 */
export function resolveStorageUrl(
  supabase: SupabaseClient,
  url: string | null | undefined
): string | null {
  if (!url || typeof url !== "string") return null;
  const parsed = parseSupabaseStorageUrl(url);
  if (!parsed) return url; // Not a Supabase storage URL (e.g. data:), use as-is
  const { data } = supabase.storage.from(parsed.bucket).getPublicUrl(parsed.path);
  return data.publicUrl;
}
