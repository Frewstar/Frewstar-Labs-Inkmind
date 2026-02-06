import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { purgeOldDesigns } from "@/app/admin/actions";

/**
 * POST /api/admin/purge — run purge (dry run or live). Admin only; uses CRON_SECRET internally.
 * Body: { dryRun: boolean }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, role")
    .eq("id", authUser.id)
    .single();

  const isAdmin = profile?.is_admin || profile?.role === "SUPER_ADMIN";
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }

  let body: { dryRun?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const isDryRun = body.dryRun !== false;
  const result = await purgeOldDesigns(cronSecret, isDryRun);

  if ("error" in result) {
    const status = result.error === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
