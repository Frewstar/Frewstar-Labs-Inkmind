import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

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
    const design = await prisma.designs.findUnique({
      where: { id },
      select: { image_url: true, prompt: true },
    });
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
