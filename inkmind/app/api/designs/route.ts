import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
      .select("id, prompt, image_url, status, created_at")
      .eq("profile_id", authUser.id)
      .order("created_at", { ascending: false });

    const normalized = (designs ?? []).map((d) => ({
      id: d.id,
      prompt: d.prompt,
      imageUrl: d.image_url,
      status: d.status,
      createdAt: d.created_at,
    }));

    return NextResponse.json({ designs: normalized });
  } catch (error) {
    console.error("[InkMind] GET /api/designs error:", error);
    return NextResponse.json(
      { error: "Failed to load designs" },
      { status: 500 }
    );
  }
}
