-- Storage bucket for artist-uploaded final drawings (Studio Admin: Upload Final Drawing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'final-tattoos',
  'final-tattoos',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload (server uploads on behalf of studio admin)
DROP POLICY IF EXISTS "final-tattoos authenticated upload" ON storage.objects;
CREATE POLICY "final-tattoos authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'final-tattoos');

-- Public read so final design images can be displayed on share page
DROP POLICY IF EXISTS "final-tattoos public read" ON storage.objects;
CREATE POLICY "final-tattoos public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'final-tattoos');
