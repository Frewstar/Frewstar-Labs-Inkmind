import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * PATCH /api/designs/[id]/favorite — update is_starred and/or collection_id for the current user's design.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const is_starred = typeof body.is_starred === "boolean" ? body.is_starred : undefined;
    const collection_id = body.collection_id !== undefined ? (body.collection_id || null) : undefined;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (is_starred !== undefined) updates.is_starred = is_starred;
    if (collection_id !== undefined) updates.collection_id = collection_id;

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json(
        { error: "Provide is_starred and/or collection_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("designs")
      .update(updates)
      .eq("id", id)
      .eq("profile_id", authUser.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    return NextResponse.json({
      design: {
        id: data.id,
        isStarred: data.is_starred ?? false,
        collectionId: data.collection_id ?? null,
      },
    });
  } catch (err) {
    console.error("[InkMind] PATCH /api/designs/[id]/favorite error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update design" },
      { status: 500 }
    );
  }
}
