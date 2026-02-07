import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is super admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin, role")
      .eq("id", authUser.id)
      .single();

    const isSuperAdmin = adminProfile?.is_admin || adminProfile?.role === "SUPER_ADMIN";
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, studioId } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
    }

    if (!["USER", "STUDIO_ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // studio_id: for STUDIO_ADMIN it's the studio they administer; for USER it's the studio they're assigned to (optional)
    const studioIdValue =
      studioId && typeof studioId === "string" && studioId.trim()
        ? studioId.trim()
        : null;

    const updates: { role: string; is_admin: boolean; studio_id: string | null } = {
      role,
      is_admin: role === "SUPER_ADMIN",
      studio_id: role === "SUPER_ADMIN" ? null : studioIdValue,
    };

    // Update the user's role (and studio when STUDIO_ADMIN)
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[InkMind] Update role error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update role" },
      { status: 500 }
    );
  }
}
