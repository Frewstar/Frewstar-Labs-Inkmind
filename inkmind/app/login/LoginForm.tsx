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
  const [isAnimating, setIsAnimating] = useState(false);

  const signUpError = signUpState?.error;
  const signInError = errorFromUrl;
  const showError = (mode === "signin" ? signInError : signUpError) && !errorDismissed;

  const handleTryAgain = () => {
    setErrorDismissed(true);
    const id = mode === "signin" ? "signin-email" : "signup-email";
    setTimeout(() => document.getElementById(id)?.focus(), 0);
  };

  const handleModeSwitch = (newMode: "signin" | "signup") => {
    if (mode === newMode || isAnimating) return;
    setIsAnimating(true);
    setErrorDismissed(false);
    setTimeout(() => {
      setMode(newMode);
      setIsAnimating(false);
    }, 200);
  };

  useEffect(() => {
    const target = signUpState?.redirectTo;
    if (target) {
      window.location.href = target;
    }
  }, [signUpState?.redirectTo]);

  useEffect(() => {
    if (signUpState?.needsEmailConfirmation) {
      window.location.href = "/login/check-email";
    }
  }, [signUpState?.needsEmailConfirmation]);

  return (
    <div className="premium-auth-card">
      {/* Ambient glow */}
      <div className="auth-glow" />

      <div className="auth-card-inner">
        {!authConfigured && (
          <div className="auth-error-banner">
            <p>
              Supabase not configured. Add{" "}
              <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
              <code>.env.local</code> and restart.
            </p>
          </div>
        )}

        {/* Logo */}
        <div className="auth-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path
              d="M20 5L8 10L20 15L32 10L20 5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 25L20 30L32 25"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 17.5L20 22.5L32 17.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>FrewstarInk</span>
        </div>

        {/* Segmented Control */}
        <div className="auth-segmented-control">
          <button
            type="button"
            onClick={() => handleModeSwitch("signin")}
            className={`segment ${mode === "signin" ? "active" : ""}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("signup")}
            className={`segment ${mode === "signup" ? "active" : ""}`}
          >
            Sign Up
          </button>
          <div
            className="segment-indicator"
            style={{ transform: mode === "signin" ? "translateX(0)" : "translateX(100%)" }}
          />
        </div>

        {/* Header */}
        <div className={`auth-header ${isAnimating ? "animating" : ""}`}>
          <h1>{mode === "signin" ? "Welcome back" : "Create account"}</h1>
          <p>
            {mode === "signin"
              ? "Sign in to access your tattoo designs"
              : "Start designing your next tattoo today"}
          </p>
        </div>

        {/* Forms */}
        <div className={`auth-forms ${isAnimating ? "animating" : ""}`}>
          {mode === "signin" ? (
            <form
              action="/auth/signin"
              method="post"
              className="auth-form"
              onSubmit={() => setErrorDismissed(false)}
            >
              {showError && signInError && (
                <div className="auth-error">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM7 4h2v5H7V4zm0 6h2v2H7v-2z" />
                  </svg>
                  <div>
                    <p>{signInError}</p>
                    <button type="button" onClick={handleTryAgain}>
                      Try again
                    </button>
                  </div>
                </div>
              )}

              <div className="input-group">
                <label htmlFor="signin-email">Email</label>
                <input
                  id="signin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="input-group">
                <label htmlFor="signin-password">Password</label>
                <input
                  id="signin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className="btn-primary">
                Sign In
              </button>

              <Link href="/" className="btn-ghost">
                Skip for now
              </Link>
            </form>
          ) : (
            <form
              action={signUpAction}
              className="auth-form"
              onSubmit={() => setErrorDismissed(false)}
            >
              {showError && signUpError && (
                <div className="auth-error">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM7 4h2v5H7V4zm0 6h2v2H7v-2z" />
                  </svg>
                  <div>
                    <p>{signUpError}</p>
                    <button type="button" onClick={handleTryAgain}>
                      Try again
                    </button>
                  </div>
                </div>
              )}

              <div className="input-group">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </div>

              <div className="input-group">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                />
              </div>

              <button type="submit" className="btn-primary">
                Create Account
              </button>

              <Link href="/" className="btn-ghost">
                Skip for now
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
