import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parseSupabaseStorageUrl, resolveStorageUrl } from "@/lib/supabase-storage";

/**
 * GET /api/designs/[id]/image — stream the design image (auth: must own the design).
 * Use this as img src so images load reliably from the same origin.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return new NextResponse(null, { status: 401 });
    }

    const { data: design, error } = await supabase
      .from("designs")
      .select("image_url, profile_id")
      .eq("id", id)
      .single();

    if (error || !design || design.profile_id !== authUser.id) {
      return new NextResponse(null, { status: 404 });
    }

    let imageUrl: string | null = null;
    try {
      imageUrl = resolveStorageUrl(supabase, design.image_url) ?? design.image_url?.trim() ?? null;
    } catch {
      imageUrl = design.image_url?.trim() ?? null;
    }
    if (!imageUrl) {
      return new NextResponse(null, { status: 404 });
    }

    // Data URL: decode base64 and stream
    if (imageUrl.startsWith("data:")) {
      const match = /^data:([^;]+);base64,(.+)$/.exec(imageUrl);
      if (match) {
        const contentType = match[1].trim() || "image/png";
        const base64 = match[2];
        try {
          const buf = Buffer.from(base64, "base64");
          return new NextResponse(buf, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=3600",
            },
          });
        } catch {
          return new NextResponse(null, { status: 404 });
        }
      }
    }

    const parsed = parseSupabaseStorageUrl(imageUrl);
    const pathOnly = !parsed && !/^https?:\/\//i.test(imageUrl) && imageUrl.match(/^([^/]+)\/(.+)$/);
    const bucket = parsed?.bucket ?? pathOnly?.[1] ?? null;
    const path = parsed?.path ?? pathOnly?.[2] ?? null;

    if (bucket && path) {
      const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(path);
      if (!downloadError && blob) {
        const buf = await blob.arrayBuffer();
        const contentType = blob.type || "image/png";
        return new NextResponse(buf, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
      const fallback = await fetch(imageUrl, { headers: { "User-Agent": "InkMind/1.0" } });
      if (fallback.ok) {
        const buf = await fallback.arrayBuffer();
        const contentType = fallback.headers.get("content-type") || "image/png";
        return new NextResponse(buf, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    const res = await fetch(imageUrl, { headers: { "User-Agent": "InkMind/1.0" } });
    if (!res.ok) return new NextResponse(null, { status: 404 });
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("[InkMind] GET /api/designs/[id]/image error:", e);
    return new NextResponse(null, { status: 500 });
  }
}
