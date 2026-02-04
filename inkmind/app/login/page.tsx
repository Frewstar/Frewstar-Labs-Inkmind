import LoginForm from "./LoginForm";
import Link from "next/link";

export const metadata = {
  title: "Sign in | InkMind",
  description: "Sign in or create an account to track your tattoo designs and daily generations.",
};

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || url.includes("your-project")) return false;
  if (!key || key === "your-anon-key") return false;
  return true;
}

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const authConfigured = isSupabaseConfigured();
  const params = await searchParams;
  const errorFromUrl = params?.error ? decodeURIComponent(params.error) : undefined;

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

      <Link
        href="/"
        className="relative z-10 mb-8 font-[var(--font-head)] text-lg font-semibold text-[var(--gold)] hover:text-[var(--white)] transition"
      >
        InkMind
      </Link>

      <div className="relative z-10 w-full flex justify-center">
        <LoginForm authConfigured={authConfigured} errorFromUrl={errorFromUrl} />
      </div>
    </main>
  );
}
