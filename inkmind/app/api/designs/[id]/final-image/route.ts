import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/db";

const BUCKET = "final-tattoos";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/designs/[id]/final-image
 * Upload artist's final drawing (JPG/PNG) for a design. Requires studio admin for the design's studio.
 * Saves to final-tattoos bucket and sets designs.final_image_url.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: designId } = await params;
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Sign in to upload." },
        { status: 401 }
      );
    }

    const design = await prisma.designs.findUnique({
      where: { id: designId },
      select: { id: true, studio_id: true },
    });

    if (!design) {
      return NextResponse.json(
        { error: "Not found", message: "Design not found." },
        { status: 404 }
      );
    }

    const profile = await prisma.profiles.findUnique({
      where: { id: authUser.id },
      select: { role: true, studio_id: true },
    });

    const isStudioAdmin =
      profile?.studio_id === design.studio_id &&
      profile?.role === "STUDIO_ADMIN";

    if (!isStudioAdmin) {
      return NextResponse.json(
        { error: "Forbidden", message: "Only studio admins can upload final drawings." },
        { status: 403 }
      );
    }

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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG and PNG are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 10 MB)." },
        { status: 400 }
      );
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${design.studio_id}/${designId}-${randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
        metadata: { design_id: designId, studio_id: design.studio_id },
      });

    if (uploadError) {
      console.error("[final-image] Upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Upload failed" },
        { status: 502 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    await prisma.designs.update({
      where: { id: designId },
      data: { final_image_url: publicUrl, updated_at: new Date() },
    });

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[final-image] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
