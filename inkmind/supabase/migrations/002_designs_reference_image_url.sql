-- Add reference_image_url to public.designs for tracking reference images used in generation
ALTER TABLE public.designs
ADD COLUMN IF NOT EXISTS reference_image_url TEXT;

COMMENT ON COLUMN public.designs.reference_image_url IS 'URL of reference image (e.g. Supabase storage) used for this design generation.';

-- Create storage bucket for reference images (so DesignStudio upload works)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reference-images',
  'reference-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload; allow public read (public bucket)
DROP POLICY IF EXISTS "reference-images authenticated upload" ON storage.objects;
CREATE POLICY "reference-images authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reference-images');

DROP POLICY IF EXISTS "reference-images public read" ON storage.objects;
CREATE POLICY "reference-images public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'reference-images');
