import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/db";

/**
 * GET /api/designs/[id] — get one design if it belongs to the current user.
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

    const prismaUser = await prisma.user.findFirst({
      where: {
        OR: [{ authId: authUser.id }, { email: authUser.email ?? undefined }],
      },
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "Forbidden", message: "No account found." },
        { status: 403 }
      );
    }

    const design = await prisma.design.findFirst({
      where: { id, clientId: prismaUser.id },
    });

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
