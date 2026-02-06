import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import PortfolioManager from "../PortfolioManager";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: studio } = await supabase
    .from("studios")
    .select("name")
    .eq("slug", slug)
    .single();
  return {
    title: studio ? `Portfolio · ${studio.name} | InkMind` : "Studio Portfolio | InkMind",
  };
}

export default async function StudioPortfolioPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.id) {
    redirect("/login");
  }

  const { data: studio } = await supabase
    .from("studios")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!studio) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, studio_id")
    .eq("id", authUser.id)
    .single();

  const isStudioAdmin =
    (profile?.studio_id === studio.id && profile?.role === "STUDIO_ADMIN") ?? false;
  if (!isStudioAdmin) {
    redirect(`/${slug}`);
  }

  const { data: portfolioRows } = await supabase
    .from("studio_portfolio")
    .select("id, image_url, title, style_tags, technical_notes, created_at")
    .eq("studio_id", studio.id)
    .order("created_at", { ascending: false });

  const portfolio = portfolioRows ?? [];

  const entries = portfolio.map((p) => ({
    id: p.id,
    image_url: p.image_url,
    title: p.title ?? null,
    style_tags: (p.style_tags ?? []) as string[],
    technical_notes: p.technical_notes,
    created_at: (p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString()),
  }));

  return (
    <div
      className="min-h-[100dvh] px-4 py-8"
      style={{
        background: "var(--bg)",
        paddingLeft: "calc(1rem + var(--safe-left))",
        paddingRight: "calc(1rem + var(--safe-right))",
        paddingBottom: "calc(2rem + var(--safe-bottom))",
      }}
    >
      <div className="mx-auto max-w-xl">
        <header className="mb-8">
          <Link
            href={`/${slug}/settings`}
            className="text-sm text-[var(--grey)] hover:text-[var(--gold)] transition mb-2 inline-block"
          >
            ← Back to settings
          </Link>
          <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)]">
            Style references
          </h1>
          <p className="mt-1 text-sm text-[var(--grey)]">
            {studio.name} · Portfolio for AI training
          </p>
        </header>

        <PortfolioManager slug={slug} studioId={studio.id} entries={entries} />
      </div>
    </div>
  );
}
