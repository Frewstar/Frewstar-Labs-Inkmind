import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * "Receiver" for Supabase email confirmation / OAuth.
 * Exchanges the code from the link for a real session cookie, then redirects.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
  }

  return NextResponse.redirect(`${origin}/admin`);
}
