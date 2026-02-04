"use client";

import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import { signUp, type SignUpResult } from "./actions";

function signUpReducer(_state: SignUpResult, formData: FormData): SignUpResult | Promise<SignUpResult> {
  return signUp(formData);
}

export default function LoginForm({
  authConfigured = true,
  errorFromUrl,
}: { authConfigured?: boolean; errorFromUrl?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [signUpState, signUpAction] = useActionState(signUpReducer, {});

  const signUpError = signUpState?.error;
  const signInError = errorFromUrl;
  const showError = (mode === "signin" ? signInError : signUpError) && !errorDismissed;

  const handleTryAgain = () => {
    setErrorDismissed(true);
    const id = mode === "signin" ? "signin-email" : "signup-email";
    setTimeout(() => document.getElementById(id)?.focus(), 0);
  };

  // After successful sign-up with session, full page nav (sign-in uses POST redirect)
  useEffect(() => {
    const target = signUpState?.redirectTo;
    if (target) {
      window.location.href = target;
    }
  }, [signUpState?.redirectTo]);

  // After sign-up when email confirmation is required
  useEffect(() => {
    if (signUpState?.needsEmailConfirmation) {
      window.location.href = "/login/check-email";
    }
  }, [signUpState?.needsEmailConfirmation]);

  return (
    <div className="auth-card w-full max-w-[400px] rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-6 shadow-xl">
      {!authConfigured && (
        <p className="mb-4 rounded-[var(--radius)] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Supabase not configured. Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code className="font-mono">.env.local</code> (from Supabase Dashboard → Project Settings → API) and restart the dev server.
        </p>
      )}
      <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)]">
        {mode === "signin" ? "Welcome back" : "Create account"}
      </h1>
      <p className="mt-1 text-sm text-[var(--grey)]">
        {mode === "signin"
          ? "Sign in to track your designs and generations."
          : "Sign up to get started. We’ll send a confirmation link to your email."}
      </p>

      {mode === "signin" ? (
        <form
          action="/auth/signin"
          method="post"
          className="mt-6 space-y-4"
          onSubmit={() => setErrorDismissed(false)}
        >
          {showError && signInError && (
            <div className="space-y-2">
              <p className="rounded-[var(--radius)] bg-[var(--red)]/20 px-3 py-2 text-sm text-[var(--red)]">
                {signInError}
              </p>
              <button
                type="button"
                onClick={handleTryAgain}
                className="text-sm font-medium text-[var(--gold)] underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}
          <div>
            <label htmlFor="signin-email" className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
              Email
            </label>
            <input
              id="signin-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-[var(--radius)] border border-white/15 bg-[var(--bg)] px-4 py-3 text-[var(--white)] placeholder:text-[var(--grey-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="signin-password" className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
              Password
            </label>
            <input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-[var(--radius)] border border-white/15 bg-[var(--bg)] px-4 py-3 text-[var(--white)] placeholder:text-[var(--grey-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-[var(--touch-min)] rounded-[var(--radius)] bg-[var(--gold)] px-4 py-3 font-medium text-[var(--bg)] transition hover:bg-[var(--gold)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
          >
            Sign in
          </button>
          <p className="text-center">
            <Link
              href="/"
              className="text-sm text-[var(--grey)] underline hover:text-[var(--white)]"
            >
              Skip for now
            </Link>
          </p>
        </form>
      ) : (
        <form
          action={signUpAction}
          className="mt-6 space-y-4"
          onSubmit={() => setErrorDismissed(false)}
        >
          {showError && signUpError && (
            <div className="space-y-2">
              <p className="rounded-[var(--radius)] bg-[var(--red)]/20 px-3 py-2 text-sm text-[var(--red)]">
                {signUpError}
              </p>
              <button
                type="button"
                onClick={handleTryAgain}
                className="text-sm font-medium text-[var(--gold)] underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}
          <div>
            <label htmlFor="signup-email" className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
              Email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-[var(--radius)] border border-white/15 bg-[var(--bg)] px-4 py-3 text-[var(--white)] placeholder:text-[var(--grey-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="mb-1 block text-xs font-medium uppercase tracking-wider text-[var(--grey)]">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className="w-full rounded-[var(--radius)] border border-white/15 bg-[var(--bg)] px-4 py-3 text-[var(--white)] placeholder:text-[var(--grey-dim)] focus:border-[var(--gold)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
              placeholder="At least 6 characters"
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-[var(--touch-min)] rounded-[var(--radius)] bg-[var(--gold)] px-4 py-3 font-medium text-[var(--bg)] transition hover:bg-[var(--gold)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
          >
            Sign up
          </button>
          <p className="text-center">
            <Link
              href="/"
              className="text-sm text-[var(--grey)] underline hover:text-[var(--white)]"
            >
              Skip for now
            </Link>
          </p>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--grey)]">
        {mode === "signin" ? (
          <>
            Don’t have an account?{" "}
            <button
              type="button"
              onClick={() => { setMode("signup"); setErrorDismissed(false); }}
              className="font-medium text-[var(--gold)] underline hover:no-underline"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => { setMode("signin"); setErrorDismissed(false); }}
              className="font-medium text-[var(--gold)] underline hover:no-underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
