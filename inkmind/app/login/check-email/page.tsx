import Link from "next/link";

export const metadata = {
  title: "Check your email | InkMind",
  description: "We sent you a confirmation link. Click it to activate your account.",
};

export default function CheckEmailPage() {
  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-12"
      style={{
        background: "var(--bg)",
        paddingTop: "calc(1.5rem + var(--safe-top))",
        paddingBottom: "calc(1.5rem + var(--safe-bottom))",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, var(--gold-dim) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[400px] rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-8 text-center shadow-xl">
        <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)]">
          Check your email
        </h1>
        <p className="mt-4 text-[var(--grey)]">
          We sent a confirmation link to your inbox. Click it to activate your account, then sign in below.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block min-h-[var(--touch-min)] rounded-[var(--radius)] border border-[var(--gold)]/30 bg-[var(--gold-dim)] px-6 py-3 font-medium text-[var(--gold)] transition hover:border-[var(--gold)] hover:bg-[var(--gold-glow)] hover:text-[var(--white)]"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
