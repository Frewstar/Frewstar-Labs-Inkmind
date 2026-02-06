import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/designs/[id] — get one design if it belongs to the current user (profile_id).
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
      return NextResponse.json(
        { error: "Unauthorized", message: "Sign in to view this design." },
        { status: 401 }
      );
    }

    const { data: design } = await supabase
      .from("designs")
      .select("*")
      .eq("id", id)
      .eq("profile_id", authUser.id)
      .single();

    if (!design) {
      return NextResponse.json(
        { error: "Not found", message: "Design not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(design);
  } catch (error) {
    console.error("[InkMind] GET /api/designs/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to load design" },
      { status: 500 }
    );
  }
}
