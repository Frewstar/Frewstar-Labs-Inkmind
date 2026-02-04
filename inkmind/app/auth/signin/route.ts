import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /auth/signin — Sign in with email/password via Route Handler so session
 * cookies are set on the redirect response. Avoids Server Action cookie persistence issues in Next.js 15.
 */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const configErr = getConfigError();
  if (configErr) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(configErr)}`);
  }

  const formData = await request.formData();
  const email = (formData.get("email") as string | null)?.trim();
  const password = formData.get("password") as string | null;

  if (!email || !password) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Email and password are required.")}`
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  if (!data?.user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Sign in failed.")}`
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();
  const isAdmin = profile?.is_admin ?? false;
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const isAdminByEmail = Boolean(adminEmail && data.user.email?.toLowerCase() === adminEmail);
  const redirectPath = isAdmin || isAdminByEmail ? "/admin" : "/";

  return NextResponse.redirect(`${origin}${redirectPath}`);
}

function getConfigError(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || url.includes("your-project"))
    return "Supabase URL is not configured. Set NEXT_PUBLIC_SUPABASE_URL in .env.local.";
  if (!key?.trim() || key === "your-anon-key")
    return "Supabase anon key is not configured. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.";
  return null;
}
