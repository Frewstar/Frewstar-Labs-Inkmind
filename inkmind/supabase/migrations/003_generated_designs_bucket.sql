-- Storage bucket for AI-generated tattoo images (saved from /api/generate)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-designs',
  'generated-designs',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload (server uploads on behalf of user)
DROP POLICY IF EXISTS "generated-designs authenticated upload" ON storage.objects;
CREATE POLICY "generated-designs authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'generated-designs');

-- Public read so design images can be displayed
DROP POLICY IF EXISTS "generated-designs public read" ON storage.objects;
CREATE POLICY "generated-designs public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'generated-designs');
