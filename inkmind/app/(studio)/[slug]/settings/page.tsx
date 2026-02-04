import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import StudioSettingsForm from "./StudioSettingsForm";

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
    title: studio ? `Settings · ${studio.name} | InkMind` : "Studio Settings | InkMind",
  };
}

export default async function StudioSettingsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.id) {
    redirect("/login");
  }

  const studio = await prisma.studios.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      instagram_url: true,
      facebook_url: true,
      contact_email: true,
      contact_phone: true,
      address: true,
    },
  });

  if (!studio) {
    notFound();
  }

  const profile = await prisma.profiles.findUnique({
    where: { id: authUser.id },
    select: { role: true, studio_id: true },
  });

  const isStudioAdmin =
    profile?.studio_id === studio.id && profile?.role === "STUDIO_ADMIN";

  if (!isStudioAdmin) {
    redirect(`/${slug}`);
  }

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
            href={`/${slug}`}
            className="text-sm text-[var(--grey)] hover:text-[var(--gold)] transition mb-2 inline-block"
          >
            ← Back to dashboard
          </Link>
          <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)]">
            Studio settings
          </h1>
          <p className="mt-1 text-sm text-[var(--grey)]">
            {studio.name} · Contact & social
          </p>
        </header>

        <StudioSettingsForm
          slug={slug}
          initial={{
            logo_url: studio.logo_url,
            instagram_url: studio.instagram_url,
            facebook_url: studio.facebook_url,
            contact_email: studio.contact_email,
            contact_phone: studio.contact_phone,
            address: studio.address,
          }}
        />
      </div>
    </div>
  );
}
