-- Storage bucket for studio portfolio references (AI style training)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'studio-portfolios',
  'studio-portfolios',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload (server uploads on behalf of studio admin)
DROP POLICY IF EXISTS "studio-portfolios authenticated upload" ON storage.objects;
CREATE POLICY "studio-portfolios authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'studio-portfolios');

-- Public read so portfolio images can be displayed and used by the AI
DROP POLICY IF EXISTS "studio-portfolios public read" ON storage.objects;
CREATE POLICY "studio-portfolios public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'studio-portfolios');
