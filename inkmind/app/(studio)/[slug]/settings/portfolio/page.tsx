import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import PortfolioManager from "../PortfolioManager";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const studio = await prisma.studios.findUnique({
    where: { slug },
    select: { name: true },
  });
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

  let studio: { id: string; name: string; slug: string } | null = null;
  let profile: { role: string | null; studio_id: string | null } | null = null;
  let portfolio: Array<{
    id: string;
    image_url: string;
    title: string | null;
    style_tags: string[];
    technical_notes: string | null;
    created_at: Date | null;
  }> = [];
  try {
    studio = await prisma.studios.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
    if (!studio) {
      notFound();
    }
    profile = await prisma.profiles.findUnique({
      where: { id: authUser.id },
      select: { role: true, studio_id: true },
    });
    portfolio = await prisma.studio_portfolio.findMany({
      where: { studio_id: studio.id },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        image_url: true,
        title: true,
        style_tags: true,
        technical_notes: true,
        created_at: true,
      },
    });
  } catch {
    redirect("/");
  }

  if (!studio) {
    notFound();
  }

  const isStudioAdmin =
    profile?.studio_id === studio.id && profile?.role === "STUDIO_ADMIN";

  if (!isStudioAdmin) {
    redirect(`/${slug}`);
  }

  const entries = portfolio.map((p) => ({
    id: p.id,
    image_url: p.image_url,
    title: p.title,
    style_tags: p.style_tags ?? [],
    technical_notes: p.technical_notes,
    created_at: (p.created_at ?? new Date()).toISOString(),
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
