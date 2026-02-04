import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/db";

/**
 * GET /api/designs — list designs for the current user (clientId = Prisma user id).
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

    const designs = await prisma.design.findMany({
      where: { clientId: prismaUser.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        prompt: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        isPaid: true,
      },
    });

    return NextResponse.json({ designs });
  } catch (error) {
    console.error("[InkMind] GET /api/designs error:", error);
    return NextResponse.json(
      { error: "Failed to load designs" },
      { status: 500 }
    );
  }
}
