import { createClient } from "@/utils/supabase/server";
import { resolveStorageUrl } from "@/lib/supabase-storage";
import DesignGalleryClient from "./DesignGalleryClient";

/**
 * Server Component: Fetches the current user's designs using the Supabase Client.
 * This directly queries your local Docker database via the Supabase API.
 */
export default async function DesignGalleryServer() {
  const supabase = await createClient();
  
  // 1. Get the authenticated user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (!authUser?.id || authError) {
    return <DesignGalleryClient designs={[]} unauthenticated />;
  }

  // 2. Fetch designs from the 'designs' table
  // We use .select() to pick exactly the columns we need
  const { data: rows, error: dbError } = await supabase
    .from('designs')
    .select(`
      id,
      prompt,
      image_url,
      reference_image_url,
      status,
      is_starred,
      collection_id,
      created_at
    `)
    .eq('profile_id', authUser.id)
    .order('created_at', { ascending: false });

  // 3. Handle Database Errors (e.g., Table not found, RLS blocking)
  if (dbError) {
    console.warn("Design gallery: database unreachable —", dbError.message);
    return (
      <DesignGalleryClient
        designs={[]}
        dbError="We couldn't connect to the local database. Ensure 'npx supabase start' is running and your .env.local points to http://127.0.0.1:54321."
      />
    );
  }

  // 4. Map the data to the format expected by your Client Component
  // Use same-origin image proxy so gallery images load reliably (no blank/cors)
  const designs = (rows || []).map((d) => {
    const hasImage = !!(d.image_url?.trim());
    const imageUrl = hasImage ? `/api/designs/${d.id}/image` : "";
    let referenceImageUrl: string | null = null;
    try {
      referenceImageUrl = resolveStorageUrl(supabase, d.reference_image_url) ?? d.reference_image_url?.trim() ?? null;
    } catch {
      referenceImageUrl = d.reference_image_url?.trim() ?? null;
    }
    return {
    id: d.id,
    prompt: d.prompt ?? "",
    imageUrl,
    referenceImageUrl,
    status: d.status,
    isStarred: d.is_starred ?? false,
    collectionId: d.collection_id ?? null,
    createdAt: new Date(d.created_at).toISOString(),
    isPaid: false, // Defaulting for demo
  };
  });

  const { data: collectionsRows } = await supabase
    .from("collections")
    .select("id, name")
    .eq("profile_id", authUser.id)
    .order("name");

  let collections = (collectionsRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  if (collections.length === 0) {
    await supabase
      .from("collections")
      .insert({ profile_id: authUser.id, name: "General" })
      .select("id, name")
      .single();
    const { data: refetch } = await supabase
      .from("collections")
      .select("id, name")
      .eq("profile_id", authUser.id)
      .order("name");
    collections = (refetch ?? []).map((c) => ({ id: c.id, name: c.name }));
  }

  return <DesignGalleryClient designs={designs} collections={collections} />;
}