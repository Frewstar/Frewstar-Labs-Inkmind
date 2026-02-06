import { createClient } from "@/utils/supabase/server";

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
  const supabase = await createClient();
  const { data: design } = await supabase
    .from("designs")
    .select("id, image_url, prompt, reference_image_url, parent_id, created_at")
    .eq("id", designId)
    .single();

  if (!design) return null;

  const ancestors: DesignHistoryItem[] = [];
  let parentId = design.parent_id;

  while (parentId) {
    const { data: parent } = await supabase
      .from("designs")
      .select("id, image_url, prompt, parent_id, created_at")
      .eq("id", parentId)
      .single();
    if (!parent) break;
    ancestors.unshift({
      id: parent.id,
      image_url: parent.image_url,
      prompt: parent.prompt,
      created_at: new Date(parent.created_at),
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
