-- Allow anyone to read files from all buckets
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (true);

-- Allow authenticated users to upload to all buckets (for your Ross generation)
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (true);