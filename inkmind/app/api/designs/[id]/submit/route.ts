import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/designs/[id]/submit — Submit design for artist review.
 * Sets status to 'pending_review', submitted_at, and optionally ross_reasoning.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: designId } = await params;
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Sign in to submit designs." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rossReasoning = typeof body?.rossReasoning === "string" ? body.rossReasoning.trim() : undefined;

    const { data: design, error: fetchError } = await supabase
      .from("designs")
      .select("id, profile_id")
      .eq("id", designId)
      .eq("profile_id", authUser.id)
      .single();

    if (fetchError || !design) {
      return NextResponse.json(
        { error: "Not found", message: "Design not found." },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("designs")
      .update({
        status: "pending_review",
        submitted_at: new Date().toISOString(),
        ...(rossReasoning && { ross_reasoning: rossReasoning }),
      })
      .eq("id", designId)
      .eq("profile_id", authUser.id);

    if (updateError) {
      console.error("[InkMind] submit design error:", updateError);
      return NextResponse.json(
        { error: "Failed to submit design." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[InkMind] POST /api/designs/[id]/submit error:", err);
    return NextResponse.json(
      { error: "Failed to submit design." },
      { status: 500 }
    );
  }
}
