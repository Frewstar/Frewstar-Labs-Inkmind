import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveStorageUrl } from "@/lib/supabase-storage";
import { getDesignHistoryChain } from "@/lib/design-history";
import { createClient } from "@/utils/supabase/server";
import ShareView from "./ShareView";

type PageProps = {
  params: Promise<{ id: string }>;
};

function firstThreeWords(prompt: string): string {
  const words = prompt.trim().split(/\s+/).filter(Boolean).slice(0, 3);
  return words.join(" ") || "Shared";
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: design } = await supabase
    .from("designs")
    .select("prompt, image_url")
    .eq("id", id)
    .single();

  if (!design) {
    return { title: "Shared design | InkMind" };
  }

  const imageUrl = resolveStorageUrl(supabase, design.image_url ?? null);

  const title = `InkMind: ${firstThreeWords(design.prompt ?? "")} Tattoo Design`;

  return {
    title,
    openGraph: {
      title,
      type: "website",
      ...(imageUrl && {
        images: [{ url: imageUrl, alt: design.prompt ?? "Tattoo design" }],
      }),
    },
    twitter: imageUrl
      ? { card: "summary_large_image", images: [imageUrl] }
      : undefined,
  };
}

export default async function ShareDesignPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: design, error: designError } = await supabase
    .from("designs")
    .select("id, image_url, reference_image_url, final_image_url, prompt, created_at, profile_id")
    .eq("id", id)
    .single();

  if (designError || !design) {
    notFound();
  }

  const imageUrl = resolveStorageUrl(supabase, design.image_url ?? null);
  const referenceImageUrl = resolveStorageUrl(supabase, design.reference_image_url ?? null);
  const finalImageUrl = resolveStorageUrl(supabase, design.final_image_url ?? null);
  const prompt = design.prompt ?? "";
  const creatorEmail: string | null = null;

  const historyData = await getDesignHistoryChain(id);
  const historyChain = historyData
    ? [
        ...historyData.ancestors.map((a) => ({
          id: a.id,
          image_url: resolveStorageUrl(supabase, a.image_url ?? null),
          prompt: a.prompt,
          created_at: a.created_at,
          isCurrent: false,
        })),
        {
          id: historyData.design.id,
          image_url: resolveStorageUrl(supabase, historyData.design.image_url ?? null),
          prompt: historyData.design.prompt,
          created_at: design.created_at,
          isCurrent: true,
        },
      ]
    : [];

  const parentImageUrl = historyData?.ancestors?.length
    ? resolveStorageUrl(supabase, historyData.ancestors[historyData.ancestors.length - 1].image_url ?? null)
    : null;

  return (
    <main
      className="min-h-[100dvh] px-4 py-8"
      style={{
        background: "var(--bg)",
        paddingTop: "calc(2rem + var(--safe-top))",
        paddingBottom: "calc(2rem + var(--safe-bottom))",
      }}
    >
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-6 inline-block font-[var(--font-head)] text-lg font-semibold text-[var(--gold)] hover:text-[var(--white)] transition"
        >
          InkMind
        </Link>

        <ShareView
          designId={id}
          imageUrl={imageUrl}
          referenceImageUrl={referenceImageUrl}
          finalImageUrl={finalImageUrl}
          parentImageUrl={parentImageUrl}
          prompt={prompt}
          creatorEmail={creatorEmail}
          historyChain={historyChain}
        />

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex min-h-[var(--touch-min)] items-center justify-center rounded-[var(--radius)] bg-[var(--gold)] px-8 py-3 font-medium text-[var(--bg)] transition hover:bg-[var(--gold)]/90"
          >
            Create Your Own
          </Link>
        </div>
      </div>
    </main>
  );
}
