-- Extend get_storage_usage to support optional studio scoping.
-- When target_studio_id is provided, only sum objects whose metadata includes that studio_id.
DROP FUNCTION IF EXISTS public.get_storage_usage(text[]);

CREATE OR REPLACE FUNCTION public.get_storage_usage(
  bucket_ids text[],
  target_studio_id uuid DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = storage, public
AS $$
  SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)::bigint
  FROM storage.objects
  WHERE bucket_id = ANY(bucket_ids)
    AND (
      target_studio_id IS NULL
      OR (metadata->>'studio_id') = target_studio_id::text
    );
$$;

COMMENT ON FUNCTION public.get_storage_usage(text[], uuid) IS
  'Returns total bytes for given buckets. If target_studio_id is set, only counts objects with metadata.studio_id = target_studio_id.';
