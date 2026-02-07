import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase-storage";

const DEFAULT_STUDIO_SLUG = "default";

async function resolveDefaultStudio(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("slug", DEFAULT_STUDIO_SLUG)
    .single();
  if (studio) return studio;
  const { data: created } = await supabase
    .from("studios")
    .insert([{ slug: DEFAULT_STUDIO_SLUG, name: "InkMind Default" }])
    .select("id")
    .single();
  if (created) return created;
  const { data: fallback } = await supabase
    .from("studios")
    .select("id")
    .eq("slug", DEFAULT_STUDIO_SLUG)
    .single();
  if (fallback) return fallback;
  throw new Error("Could not resolve default studio");
}

/**
 * GET /api/designs — list designs for the current user (profile_id = auth user id).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Sign in to view your designs." },
        { status: 401 }
      );
    }

    const { data: designs } = await supabase
      .from("designs")
      .select("id, prompt, image_url, status, created_at, is_starred, collection_id, studio_id")
      .eq("profile_id", authUser.id)
      .order("created_at", { ascending: false });

    const normalized = (designs ?? []).map((d) => {
      const raw = (d.image_url ?? "")
        .replace(/\r\n?|\n/g, "")
        .trim()
        .replace(/\]+$/, "")
        .trim();
      const hasImage = !!raw && !raw.startsWith("blob:");
      let imageUrl = "";
      if (hasImage) {
        try {
          const resolved = resolveStorageUrl(supabase, raw) ?? "";
          // Only use if it's a full URL (storage or http) — avoid passing bare filenames
          if (resolved.startsWith("http") || resolved.includes("/storage/")) {
            imageUrl = resolved;
          }
        } catch {
          imageUrl = "";
        }
      }
      return {
      id: d.id,
      prompt: d.prompt,
      imageUrl,
      status: d.status,
      createdAt: d.created_at,
      isStarred: d.is_starred ?? false,
      collectionId: d.collection_id ?? null,
      studioId: d.studio_id ?? null,
    };
    });

    return NextResponse.json({ designs: normalized });
  } catch (error) {
    console.error("[InkMind] GET /api/designs error:", error);
    return NextResponse.json(
      { error: "Failed to load designs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/designs — save a design (from "heart" in Design Studio): upload image to Storage, create design row.
 * Accepts either:
 * - file: image File (preferred)
 * - image_data_url: data URL string (e.g. data:image/png;base64,...) — decoded and uploaded so we never persist blob URLs.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Sign in to save designs." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const imageDataUrl = (formData.get("image_data_url") as string) ?? "";
    const prompt = (formData.get("prompt") as string) ?? "";
    const style = (formData.get("style") as string) ?? "";
    const isStarred = formData.get("is_starred") === "true";
    const collectionId = (formData.get("collection_id") as string) || null;

    let buf: ArrayBuffer;
    let contentType: string;

    if (file && file instanceof File && file.size > 0) {
      buf = await file.arrayBuffer();
      contentType = file.type || (file.name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg");
    } else if (imageDataUrl && imageDataUrl.startsWith("data:") && imageDataUrl.includes(";base64,")) {
      const match = /^data:([^;]+);base64,(.+)$/.exec(imageDataUrl);
      if (!match) {
        return NextResponse.json(
          { error: "Invalid image_data_url" },
          { status: 400 }
        );
      }
      contentType = match[1].trim() || "image/png";
      let decoded: Buffer;
      try {
        decoded = Buffer.from(match[2], "base64");
      } catch {
        return NextResponse.json(
          { error: "Invalid base64 in image_data_url" },
          { status: 400 }
        );
      }
      if (decoded.length === 0) {
        return NextResponse.json(
          { error: "Empty image data" },
          { status: 400 }
        );
      }
      buf = decoded.buffer.slice(decoded.byteOffset, decoded.byteOffset + decoded.byteLength);
    } else {
      return NextResponse.json(
        { error: "No file or image_data_url provided" },
        { status: 400 }
      );
    }

    const studio = await resolveDefaultStudio(supabase);
    const ext = contentType.includes("png") ? "png" : "jpg";
    const path = `${authUser.id}/${Date.now()}-design.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("generated-designs")
      .upload(path, buf, {
        contentType: contentType || (ext === "png" ? "image/png" : "image/jpeg"),
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[InkMind] POST /api/designs upload error:", uploadError);
      return NextResponse.json(
        { error: uploadError.message ?? "Upload failed" },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from("generated-designs").getPublicUrl(path);
    const imageUrl = urlData.publicUrl;

    const promptForDb = [prompt, style].filter(Boolean).join(" — ") || "Custom design";

    const { data: design, error: dbError } = await supabase
      .from("designs")
      .insert({
        profile_id: authUser.id,
        studio_id: studio.id,
        image_url: imageUrl,
        prompt: promptForDb,
        is_starred: isStarred,
        collection_id: collectionId || null,
        status: "draft",
      })
      .select("id, prompt, image_url, status, created_at, is_starred, collection_id")
      .single();

    if (dbError) {
      console.error("[InkMind] POST /api/designs insert error:", dbError);
      return NextResponse.json(
        { error: dbError.message ?? "Failed to save design" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      design: {
        id: design.id,
        prompt: design.prompt,
        imageUrl: design.image_url,
        status: design.status,
        createdAt: design.created_at,
        isStarred: design.is_starred ?? false,
        collectionId: design.collection_id ?? null,
      },
    });
  } catch (err) {
    console.error("[InkMind] POST /api/designs error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save design" },
      { status: 500 }
    );
  }
}
