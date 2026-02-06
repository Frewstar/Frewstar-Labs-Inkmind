ALTER TABLE public.designs 
ADD COLUMN IF NOT EXISTS reference_image_urls text[] DEFAULT '{}';