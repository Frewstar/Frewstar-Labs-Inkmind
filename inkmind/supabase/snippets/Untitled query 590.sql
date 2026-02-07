SELECT id, profile_id, LEFT(image_url, 100) AS image_url_preview, created_at
FROM public.designs
ORDER BY created_at DESC
LIMIT 10;