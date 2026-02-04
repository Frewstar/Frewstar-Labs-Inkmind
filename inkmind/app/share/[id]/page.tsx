import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { getDesignHistoryChain } from "@/lib/design-history";
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
  const design = await prisma.designs.findUnique({
    where: { id },
    select: { prompt: true, image_url: true },
  });

  if (!design) {
    return { title: "Shared design | InkMind" };
  }

  const title = `InkMind: ${firstThreeWords(design.prompt ?? "")} Tattoo Design`;
  const imageUrl = design.image_url ?? null;

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

  const design = await prisma.designs.findUnique({
    where: { id },
    include: {
      profiles: {
        include: {
          users: { select: { email: true } },
        },
      },
    },
  });

  if (!design) {
    notFound();
  }

  const imageUrl = design.image_url ?? null;
  const referenceImageUrl = design.reference_image_url ?? null;
  const finalImageUrl = design.final_image_url ?? null;
  const prompt = design.prompt ?? "";
  const creatorEmail = design.profiles?.users?.email ?? null;

  const historyData = await getDesignHistoryChain(id);
  const historyChain = historyData
    ? [
        ...historyData.ancestors.map((a) => ({
          id: a.id,
          image_url: a.image_url,
          prompt: a.prompt,
          created_at: a.created_at,
          isCurrent: false,
        })),
        {
          id: historyData.design.id,
          image_url: historyData.design.image_url,
          prompt: historyData.design.prompt,
          created_at: design.created_at,
          isCurrent: true,
        },
      ]
    : [];

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
          parentImageUrl={historyData?.ancestors?.length ? historyData.ancestors[historyData.ancestors.length - 1].image_url ?? null : null}
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
