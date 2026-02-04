"use client";

import Link from "next/link";
import { useActionState, useState, useEffect } from "react";
import { signIn, signUp, type SignInResult, type SignUpResult } from "./actions";

function signUpReducer(_state: SignUpResult, formData: FormData): SignUpResult | Promise<SignUpResult> {
  return signUp(formData);
}

function signInReducer(_state: SignInResult, formData: FormData): SignInResult | Promise<SignInResult> {
  return signIn(formData);
}

export default function LoginForm({ authConfigured = true }: { authConfigured?: boolean }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signUpState, signUpAction] = useActionState(signUpReducer, {});
  const [signInState, signInAction] = useActionState(signInReducer, {});

  const signUpError = signUpState?.error;
  const signInError = signInState?.error;

  // After successful sign-in or sign-up with session, full page nav so session cookies are sent
  useEffect(() => {
    const target = signInState?.redirectTo ?? signUpState?.redirectTo;
    if (target) {
      window.location.href = target;
    }
  }, [signInState?.redirectTo, signUpState?.redirectTo]);

  // After sign-up when email confirmation is required
  useEffect(() => {
    if (signUpState?.needsEmailConfirmation) {
      window.location.href = "/login/check-email";
    }
  }, [signUpState?.needsEmailConfirmation]);

  if (!authConfigured) {
    return (
      <div className="auth-card w-full max-w-[400px] rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-6 shadow-xl">
        <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)]">
          Welcome
        </h1>
        <p className="mt-1 text-sm text-[var(--grey)]">
          Sign-in is not configured. Continue to the app without an account.
        </p>
        <Link
          href="/"
          className="mt-6 flex w-full min-h-[var(--touch-min)] items-center justify-center rounded-[var(--radius)] bg-[var(--gold)] px-4 py-3 font-medium text-[var(--bg)] transition hover:bg-[var(--gold)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
        >
          Continue to app
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card w-full max-w-[400px] rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-6 shadow-xl">
      <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)]">
        {mode === "signin" ? "Welcome back" : "Create account"}
      </h1>
      <p className="mt-1 text-sm text-[var(--grey)]">
        {mode === "signin"
          ? "Sign in to track your designs and generations."
          : "Sign up to get started. We’ll send a confirmation link to your email."}
      </p>

      {mode === "signin" ? (
        <form action={signInAction} className="mt-6 space-y-4">
          {signInError && (
            <p className="rounded-[var(--radius)] bg-[var(--red)]/20 px-3 py-2 text-sm text-[var(--red)]">
              {signInError}
            </p>
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
        </form>
      ) : (
        <form action={signUpAction} className="mt-6 space-y-4">
          {signUpError && (
            <p className="rounded-[var(--radius)] bg-[var(--red)]/20 px-3 py-2 text-sm text-[var(--red)]">
              {signUpError}
            </p>
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
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--grey)]">
        {mode === "signin" ? (
          <>
            Don’t have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
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
              onClick={() => setMode("signin")}
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
