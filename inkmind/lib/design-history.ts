import prisma from "@/lib/db";

export type DesignHistoryItem = {
  id: string;
  image_url: string | null;
  prompt: string | null;
  created_at: Date;
};

/**
 * Load the design and its ancestor chain (parent, grandparent, ...) for history UI.
 * Returns the current design and ancestors from oldest to direct parent.
 */
export async function getDesignHistoryChain(designId: string): Promise<{
  design: { id: string; image_url: string | null; prompt: string | null; reference_image_url: string | null; parent_id: string | null };
  ancestors: DesignHistoryItem[];
} | null> {
  const design = await prisma.designs.findUnique({
    where: { id: designId },
    select: {
      id: true,
      image_url: true,
      prompt: true,
      reference_image_url: true,
      parent_id: true,
      created_at: true,
    },
  });

  if (!design) return null;

  const ancestors: DesignHistoryItem[] = [];
  let parentId = design.parent_id;

  while (parentId) {
    const parent = await prisma.designs.findUnique({
      where: { id: parentId },
      select: { id: true, image_url: true, prompt: true, parent_id: true, created_at: true },
    });
    if (!parent) break;
    ancestors.unshift({
      id: parent.id,
      image_url: parent.image_url,
      prompt: parent.prompt,
      created_at: parent.created_at,
    });
    parentId = parent.parent_id;
  }

  return {
    design: {
      id: design.id,
      image_url: design.image_url,
      prompt: design.prompt,
      reference_image_url: design.reference_image_url,
      parent_id: design.parent_id,
    },
    ancestors,
  };
}
