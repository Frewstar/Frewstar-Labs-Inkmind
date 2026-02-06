import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/designs/[id]/public — return image_url and prompt for a design (no auth).
 * Used when "Branch off from here" links to /?parent_id= so the app can load the reference.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: design } = await supabase
      .from("designs")
      .select("image_url, prompt")
      .eq("id", id)
      .single();
    if (!design) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      imageUrl: design.image_url ?? null,
      prompt: design.prompt ?? null,
    });
  } catch (error) {
    console.error("[InkMind] GET /api/designs/[id]/public error:", error);
    return NextResponse.json({ error: "Failed to load design" }, { status: 500 });
  }
}
