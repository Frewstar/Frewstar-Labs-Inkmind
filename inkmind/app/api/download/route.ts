import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import prisma from "@/lib/db";

/**
 * GET /api/download
 *
 * Fetches the image from the given Supabase (or any) URL and tells the browser
 * to save it to disk instead of displaying it.
 *
 * Query params:
 * - url: image URL (encoded) — fetch image from this URL
 * - id: design ID — look up image_url from DB (alternative to url)
 * - filename: optional; defaults to "tattoo-design.png"
 *
 * Response: image/png with Content-Disposition: attachment so the browser
 * triggers a download. Image is watermarked before return.
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
    const design = await prisma.designs.findUnique({
      where: { id },
      select: { image_url: true },
    });
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

  let arrayBuffer: ArrayBuffer;
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "InkMind-Download/1.0" },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${res.status}` },
        { status: 502 }
      );
    }
    arrayBuffer = await res.arrayBuffer();
  } catch (err) {
    console.error("[download] fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 }
    );
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
