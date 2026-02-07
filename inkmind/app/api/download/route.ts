import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";
import { parseSupabaseStorageUrl } from "@/lib/supabase-storage";

/**
 * GET /api/download
 *
 * For design id: downloads from Supabase storage via client (avoids public URL 400).
 * For url param: fetches the given URL (e.g. external or data URL).
 * Returns image/png with Content-Disposition: attachment (watermarked).
 *
 * Query params:
 * - url: image URL (encoded) — fetch from this URL
 * - id: design ID — look up image_url, then download from storage by bucket/path
 * - filename: optional; defaults to "tattoo-design.png"
 */
const WATERMARK_PADDING = 16;
const WATERMARK_FONT_SIZE = 14;
const WATERMARK_WIDTH = 110;
const WATERMARK_HEIGHT = 32;

/**
 * Build SVG buffer for "InkMind" text: white 0.4 opacity + slight drop shadow
 * so it's visible on both light and dark tattoos.
 */
function buildWatermarkSvg(): Buffer {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WATERMARK_WIDTH}" height="${WATERMARK_HEIGHT}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="black" flood-opacity="0.6"/>
    </filter>
  </defs>
  <text
    x="${WATERMARK_WIDTH - 4}"
    y="${WATERMARK_HEIGHT - 8}"
    text-anchor="end"
    font-family="sans-serif"
    font-size="${WATERMARK_FONT_SIZE}"
    font-weight="500"
    fill="rgba(255,255,255,0.4)"
    filter="url(#shadow)"
  >InkMind</text>
</svg>`.trim();
  return Buffer.from(svg);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const urlParam = searchParams.get("url");
  const filenameParam = searchParams.get("filename") ?? "tattoo-design.png";

  let imageUrl: string;

  if (urlParam) {
    imageUrl = decodeURIComponent(urlParam);
  } else if (id) {
    const supabase = await createClient();
    const { data: design } = await supabase
      .from("designs")
      .select("image_url")
      .eq("id", id)
      .single();
    if (!design?.image_url) {
      return NextResponse.json(
        { error: "Design not found" },
        { status: 404 }
      );
    }
    imageUrl = design.image_url;
  } else {
    return NextResponse.json(
      { error: "Missing id or url query parameter" },
      { status: 400 }
    );
  }

  // Prefer Supabase storage download (avoids 400 when fetching public URL from server)
  const parsed = parseSupabaseStorageUrl(imageUrl);
  const pathOnlyMatch = !parsed && !/^https?:\/\//i.test(imageUrl) && imageUrl.match(/^([^/]+)\/(.+)$/);
  const bucket = parsed?.bucket ?? pathOnlyMatch?.[1] ?? null;
  const path = parsed?.path ?? pathOnlyMatch?.[2] ?? null;

  let arrayBuffer: ArrayBuffer;

  const fetchFromUrl = async (): Promise<ArrayBuffer> => {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "InkMind-Download/1.0" },
    });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    return res.arrayBuffer();
  };

  if (bucket && path) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (!error && data) {
      arrayBuffer = await data.arrayBuffer();
    } else {
      const storageErr = error?.message ?? "no data";
      console.warn("[download] storage.download failed, falling back to fetch:", storageErr, { bucket, path });
      try {
        arrayBuffer = await fetchFromUrl();
      } catch (err) {
        console.error("[download] fetch fallback error:", err);
        const msg = process.env.NODE_ENV === "development"
          ? `Storage: ${storageErr}. Fetch failed: ${err instanceof Error ? err.message : String(err)}`
          : "Failed to get image from storage";
        return NextResponse.json(
          { error: msg },
          { status: 502 }
        );
      }
    }
  } else {
    try {
      arrayBuffer = await fetchFromUrl();
    } catch (err) {
      console.error("[download] fetch error:", err);
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 502 }
      );
    }
  }

  const buffer = Buffer.from(arrayBuffer);
  const watermarkSvg = buildWatermarkSvg();

  try {
    const image = sharp(buffer);
    const meta = await image.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    const left = Math.max(0, width - WATERMARK_WIDTH - WATERMARK_PADDING);
    const top = Math.max(0, height - WATERMARK_HEIGHT - WATERMARK_PADDING);

    const watermarked = await image
      .composite([
        {
          input: watermarkSvg,
          left,
          top,
        },
      ])
      .png()
      .toBuffer();

    const safeFilename = filenameParam.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "tattoo-design.png";
    const disposition = `attachment; filename="${safeFilename}"`;
    return new NextResponse(watermarked, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("[download] sharp error:", err);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
