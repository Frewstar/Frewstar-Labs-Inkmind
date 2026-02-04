"use server";

import { createClient } from "@/utils/supabase/server";

export type SignUpResult = { error?: string; needsEmailConfirmation?: boolean; redirectTo?: string };
export type SignInResult = { error?: string; redirectTo?: string };

function getSupabaseConfigError(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || url.includes("your-project")) return "Supabase URL is not configured. Set NEXT_PUBLIC_SUPABASE_URL in .env.local.";
  if (!key?.trim() || key === "your-anon-key") return "Supabase anon key is not configured. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.";
  return null;
}

/**
 * Sign up with email and password. Supabase trigger will create a profiles row.
 * If email confirmation is required, user is redirected to check-email.
 */
export async function signUp(formData: FormData): Promise<SignUpResult> {
  try {
    const configErr = getSupabaseConfigError();
    if (configErr) return { error: configErr };

    const email = formData.get("email") as string | null;
    const password = formData.get("password") as string | null;

    if (!email?.trim() || !password) {
      return { error: "Email and password are required." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/callback` },
    });

    if (error) {
      return { error: error.message };
    }

    if (data?.user && !data.session) {
      return { needsEmailConfirmation: true };
    }

    if (data?.session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .single();
      const isAdmin = profile?.is_admin ?? false;
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      const isAdminByEmail = adminEmail && data.user.email?.toLowerCase() === adminEmail;
      if (isAdmin || isAdminByEmail) {
        return { redirectTo: "/admin" };
      }
      return { redirectTo: "/" };
    }

    return { needsEmailConfirmation: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign up failed.";
    return { error: message };
  }
}

/**
 * Sign in with email and password. Redirects to /admin if user is admin.
 */
export async function signIn(formData: FormData): Promise<SignInResult> {
  try {
    const configErr = getSupabaseConfigError();
    if (configErr) return { error: configErr };

    const email = formData.get("email") as string | null;
    const password = formData.get("password") as string | null;

    if (!email?.trim() || !password) {
      return { error: "Email and password are required." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .single();
      const isAdmin = profile?.is_admin ?? false;
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      const isAdminByEmail = adminEmail && data.user.email?.toLowerCase() === adminEmail;
      if (isAdmin || isAdminByEmail) {
        return { redirectTo: "/admin" };
      }
      return { redirectTo: "/" };
    }

    return { error: "Sign in failed." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in failed. Check your connection and try again.";
    return { error: message };
  }
}
