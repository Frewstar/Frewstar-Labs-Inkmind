-- Storage bucket for studio branding (logos). Path: logos/[studio_id]/logo.png
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'studio-assets',
  'studio-assets',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload (server uploads on behalf of studio admin)
DROP POLICY IF EXISTS "studio-assets authenticated upload" ON storage.objects;
CREATE POLICY "studio-assets authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'studio-assets');

-- Authenticated users can update (overwrite logo)
DROP POLICY IF EXISTS "studio-assets authenticated update" ON storage.objects;
CREATE POLICY "studio-assets authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'studio-assets');

-- Public read so logos can be displayed
DROP POLICY IF EXISTS "studio-assets public read" ON storage.objects;
CREATE POLICY "studio-assets public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'studio-assets');
