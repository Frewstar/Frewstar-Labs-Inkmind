import prisma from "@/lib/db";
import AdminDesignsList from "../AdminDesignsList";

export const metadata = {
  title: "All Designs | Admin | InkMind",
  description: "View and manage every tattoo design and reference image.",
};

type PageProps = {
  searchParams: Promise<{ query?: string }> | { query?: string };
};

export default async function AdminDesignsPage({ searchParams }: PageProps) {
  const resolved = await Promise.resolve(searchParams);
  const query = (resolved.query ?? "").trim();

  const designs = await prisma.designs.findMany({
    where:
      query.length > 0
        ? {
            OR: [
              { prompt: { contains: query, mode: "insensitive" } },
              { profiles: { users: { email: { contains: query, mode: "insensitive" } } } },
            ],
          }
        : undefined,
    orderBy: { created_at: "desc" },
    include: {
      profiles: {
        include: {
          users: { select: { email: true } },
        },
      },
      studios: { select: { name: true } },
    },
  });

  const items = designs.map((d) => ({
    id: d.id,
    prompt: d.prompt ?? "",
    imageUrl: d.image_url ?? null,
    referenceImageUrl: d.reference_image_url ?? null,
    status: d.status,
    createdAt: d.created_at.toISOString(),
    userEmail: d.profiles?.users?.email ?? null,
    studioName: d.studios?.name ?? null,
  }));

  return (
    <>
      <h1 className="font-[var(--font-head)] text-2xl font-semibold text-[var(--white)]">
        All Designs
      </h1>
      <p className="mt-2 text-[var(--grey)]">
        Every tattoo generated and every reference image. Delete removes the record and the file from storage.
      </p>

      <AdminDesignsList designs={items} initialQuery={query} />
    </>
  );
}
