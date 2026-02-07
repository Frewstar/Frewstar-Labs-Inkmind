import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const ALLOWED_STATUSES = ["draft", "pending", "pending_review", "approved", "revision_requested"];

/**
 * PATCH /api/designs/[id] — update design status (owner or studio admin).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const status = typeof body?.status === "string" ? body.status.trim() : "";

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: design } = await supabase
      .from("designs")
      .select("id, profile_id, studio_id")
      .eq("id", id)
      .single();

    if (!design) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("studio_id, role, is_admin")
      .eq("id", authUser.id)
      .single();

    const isOwner = design.profile_id === authUser.id;
    const isStudioAdmin = profile?.studio_id === design.studio_id || profile?.is_admin || profile?.role === "SUPER_ADMIN";

    if (!isOwner && !isStudioAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("designs")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("[InkMind] PATCH designs error:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[InkMind] PATCH /api/designs/[id] error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

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
