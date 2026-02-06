import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import GenerationTracker from "@/components/dashboard/GenerationTracker";

export default async function StudioSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { daily_generations: number } | null = null;
  if (user?.id) {
    const { data } = await supabase
      .from("profiles")
      .select("daily_generations")
      .eq("id", user.id)
      .single();
    profile = data ?? null;
  }

  return (
    <div className="flex min-h-[100dvh] w-full">
      <aside
        className="w-56 shrink-0 border-r border-white/10 bg-[var(--bg-card)]"
        style={{ paddingLeft: "var(--safe-left)" }}
      >
        <div className="sticky top-0 flex flex-col gap-6 py-6 pl-4 pr-4">
          <Link
            href="/"
            className="font-[var(--font-head)] text-lg font-semibold text-[var(--white)] hover:text-[var(--gold)] transition"
          >
            InkMind
          </Link>
          <GenerationTracker dailyGenerations={profile?.daily_generations ?? 0} />
          <Link
            href="/"
            className="mt-auto pt-4 text-sm text-[var(--grey)] hover:text-[var(--gold)] transition"
          >
            Back to app
          </Link>
        </div>
      </aside>
      <main
        className="min-h-[100dvh] flex-1 overflow-auto px-6 py-8"
        style={{
          paddingRight: "calc(1.5rem + var(--safe-right))",
          paddingLeft: "calc(1.5rem + var(--safe-left))",
        }}
      >
        {children}
      </main>
    </div>
  );
}
