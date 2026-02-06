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
 * - If the URL is a Supabase storage URL from a *different* host (e.g. cloud vs local), return as-is
 *   so the image loads from where it was actually stored (avoids blank images when DB has cloud URLs but app uses local).
 * - If same host or path-only, build URL with current supabase so local/cloud both work.
 */
export function resolveStorageUrl(
  supabase: SupabaseClient,
  url: string | null | undefined
): string | null {
  if (!url || typeof url !== "string") return null;
  const parsed = parseSupabaseStorageUrl(url);
  if (parsed) {
    try {
      const storedHost = new URL(url).host;
      const currentUrl = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) || "";
      const currentHost = currentUrl ? new URL(currentUrl).host : "";
      if (storedHost !== currentHost) {
        return url;
      }
    } catch {
      /* ignore */
    }
    const { data } = supabase.storage.from(parsed.bucket).getPublicUrl(parsed.path);
    return data.publicUrl;
  }
  // Path-only stored in DB? e.g. "generated-designs/abc/file.png"
  const pathMatch = url.match(/^([^/]+)\/(.+)$/);
  if (pathMatch) {
    const [, bucket, path] = pathMatch;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
  return url;
}
