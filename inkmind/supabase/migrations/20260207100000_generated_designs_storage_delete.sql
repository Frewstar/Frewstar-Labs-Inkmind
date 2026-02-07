-- Allow authenticated users to delete their design files from generated-designs (so "Delete" in gallery works)
DROP POLICY IF EXISTS "generated-designs authenticated delete" ON storage.objects;
CREATE POLICY "generated-designs authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'generated-designs');
