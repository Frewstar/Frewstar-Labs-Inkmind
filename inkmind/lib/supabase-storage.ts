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
 * Rewrite a Supabase storage URL to use the current env base (NEXT_PUBLIC_SUPABASE_URL).
 * When moving from Cloud to local Docker (or vice versa), the DB may still have the old domain.
 * This ensures we always redirect/load from the same Supabase instance the app is configured for.
 */
export function normalizeStorageUrlToCurrentBase(url: string): string {
  const parsed = parseSupabaseStorageUrl(url);
  if (!parsed) return url;
  const base = typeof process !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!base) return url;
  try {
    const pathname = new URL(url).pathname;
    const normalized = base.endsWith("/") ? `${base.slice(0, -1)}${pathname}` : `${base}${pathname}`;
    return normalized;
  } catch {
    return url;
  }
}

/**
 * Resolve a design image URL using Supabase's getPublicUrl helper.
 * - If the URL is already a full Supabase storage URL: normalize it to the current env base
 *   (so local dev uses http://127.0.0.1:54321 even when DB has cloud URLs).
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
    return normalizeStorageUrlToCurrentBase(raw);
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
