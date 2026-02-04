-- RPC: Return total bytes used by the given storage buckets (for admin storage meter).
-- storage.objects.metadata->>'size' holds file size in bytes.
CREATE OR REPLACE FUNCTION public.get_storage_usage(bucket_ids text[])
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = storage, public
AS $$
  SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)::bigint
  FROM storage.objects
  WHERE bucket_id = ANY(bucket_ids);
$$;

COMMENT ON FUNCTION public.get_storage_usage(text[]) IS 'Returns total bytes used by the given storage bucket IDs (e.g. reference-images, generated-designs).';
