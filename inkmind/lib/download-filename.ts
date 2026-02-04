const MAX_KEYWORD_LENGTH = 48;
const MAX_WORDS = 6;

/**
 * Build a descriptive download filename from a prompt: Inkmind-Tattoo-[keywords].png
 * Safe for all filesystems; truncated so it stays under typical limits.
 */
export function promptToDownloadFilename(
  prompt: string,
  options?: { suffix?: string | number }
): string {
  const raw = (prompt || "").trim();
  const words = raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_WORDS);
  const slug = words.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, MAX_KEYWORD_LENGTH);
  const keywords = slug || "design";
  const suffix = options?.suffix != null ? `-${options.suffix}` : "";
  return `Inkmind-Tattoo-${keywords}${suffix}.png`;
}
