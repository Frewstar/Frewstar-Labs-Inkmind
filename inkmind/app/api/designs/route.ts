import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
      const hasImage = !!(d.image_url?.trim());
      const imageUrl = hasImage ? `/api/designs/${d.id}/image` : "";
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
 * POST /api/designs — save a design (from "heart" in Design Studio): upload image, create design row.
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
    const prompt = (formData.get("prompt") as string) ?? "";
    const style = (formData.get("style") as string) ?? "";
    const isStarred = formData.get("is_starred") === "true";
    const collectionId = (formData.get("collection_id") as string) || null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const studio = await resolveDefaultStudio(supabase);
    const ext = file.name.toLowerCase().endsWith(".png") ? "png" : "jpg";
    const path = `${authUser.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const buf = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("generated-designs")
      .upload(path, buf, {
        contentType: file.type || (ext === "png" ? "image/png" : "image/jpeg"),
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
