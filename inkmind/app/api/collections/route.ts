import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/collections — list collections for the current user.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("collections")
      .select("id, name, created_at")
      .eq("profile_id", authUser.id)
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let list = data ?? [];
    if (list.length === 0) {
      const { data: inserted } = await supabase
        .from("collections")
        .insert({ profile_id: authUser.id, name: "General" })
        .select("id, name, created_at")
        .single();
      if (inserted) list = [inserted];
    }

    return NextResponse.json({
      collections: list.map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.created_at,
      })),
    });
  } catch (err) {
    console.error("[InkMind] GET /api/collections error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/collections — create a new collection.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Collection name required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("collections")
      .insert({ profile_id: authUser.id, name })
      .select("id, name, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      collection: {
        id: data.id,
        name: data.name,
        createdAt: data.created_at,
      },
    });
  } catch (err) {
    console.error("[InkMind] POST /api/collections error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create collection" },
      { status: 500 }
    );
  }
}
