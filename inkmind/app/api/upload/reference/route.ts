import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";

const MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;
const BUCKET = "reference-images";

/**
 * Optimize reference image with sharp before upload:
 * - Convert to WebP at 80% quality (balance of size and clarity)
 * - If width > 1200px, resize to 1200px (aspect ratio preserved)
 * - Strip all EXIF metadata to reduce file size
 * The final optimized buffer is uploaded to Supabase reference-images.
 */
export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file") ?? formData.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing file (use field name 'file' or 'image')" },
      { status: 400 }
    );
  }

  const studioId = (formData.get("studioId") ?? formData.get("studio_id"))?.toString().trim() || null;

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  let optimizedBuffer: Buffer;
  try {
    const image = sharp(inputBuffer);
    const meta = await image.metadata();
    const width = meta.width ?? 0;

    // Apply EXIF orientation so the image is correct, then strip metadata (no withMetadata = no EXIF in output)
    let pipeline = image.rotate();
    if (width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null);
    }
    optimizedBuffer = await pipeline
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (err) {
    console.error("[upload/reference] sharp error:", err);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const path = `${Date.now()}-${randomUUID()}.webp`;

  const uploadOptions: { contentType: string; cacheControl: string; upsert: boolean; metadata?: Record<string, string> } = {
    contentType: "image/webp",
    cacheControl: "3600",
    upsert: false,
  };
  if (studioId) uploadOptions.metadata = { studio_id: studioId };

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, optimizedBuffer, uploadOptions);

  if (uploadError) {
    console.error("[upload/reference] Supabase upload error:", uploadError);
    return NextResponse.json(
      { error: uploadError.message || "Upload failed" },
      { status: 502 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
