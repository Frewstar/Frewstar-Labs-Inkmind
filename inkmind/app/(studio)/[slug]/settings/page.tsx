import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import StudioSettingsForm from "./StudioSettingsForm";
import StyleSettings from "./StyleSettings";

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

  const { data: studio } = await supabase
    .from("studios")
    .select("id, name, slug, logo_url, instagram_url, facebook_url, contact_email, contact_phone, address, ai_name, artist_voice_tone, ai_personality_prompt, studio_specialties, style_adherence")
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
          <Link
            href={`/${slug}/settings/portfolio`}
            className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--gold)] hover:text-[var(--gold)]/90 transition"
          >
            Manage style references for AI →
          </Link>
        </header>

        <StyleSettings
          slug={slug}
          studioId={studio.id}
          studioName={studio.name ?? slug}
          initialData={{
            ai_name: studio.ai_name,
            artist_voice_tone: studio.artist_voice_tone,
            ai_personality_prompt: studio.ai_personality_prompt,
            studio_specialties: studio.studio_specialties ?? [],
            style_adherence: studio.style_adherence ?? null,
          }}
        />
        <div className="mt-10">
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
    </div>
  );
}
