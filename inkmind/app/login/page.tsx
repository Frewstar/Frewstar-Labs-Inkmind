import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in | FrewstarInk",
  description: "Sign in or create an account to save your tattoo designs.",
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
    <main className="premium-auth-page">
      <LoginForm authConfigured={authConfigured} errorFromUrl={errorFromUrl} />
    </main>
  );
}
