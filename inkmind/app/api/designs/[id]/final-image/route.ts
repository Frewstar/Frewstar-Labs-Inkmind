import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/utils/supabase/server";

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

    const { data: design } = await supabase
      .from("designs")
      .select("id, studio_id")
      .eq("id", designId)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, studio_id")
      .eq("id", authUser.id)
      .single();

    if (!design) {
      return NextResponse.json(
        { error: "Not found", message: "Design not found." },
        { status: 404 }
      );
    }

    const isStudioAdmin =
      design &&
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

    await supabase
      .from("designs")
      .update({ final_image_url: publicUrl })
      .eq("id", designId);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[final-image] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
