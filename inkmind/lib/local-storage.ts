import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = "public/uploads/generated";

/**
 * Parse a data URL or raw base64 string; return buffer and extension.
 */
function parseDataUrl(dataUrl: string): { buffer: Buffer; ext: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = match ? match[1] : "image/png";
  const base64 = match ? match[2] : dataUrl;
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpg" : "png";
  return { buffer: Buffer.from(base64, "base64"), ext };
}

/**
 * Save a generated image (base64 data URL) to the local folder public/uploads/generated.
 * Returns the public URL path (e.g. /uploads/generated/{uuid}.png) for use in img src or download.
 * Use when USE_LOCAL_STORAGE=true for testing without Supabase.
 */
export async function saveGeneratedImageToLocal(dataUrl: string): Promise<string> {
  const { buffer, ext } = parseDataUrl(dataUrl);
  const dir = path.join(process.cwd(), UPLOAD_DIR);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);
  return `/uploads/generated/${filename}`;
}
