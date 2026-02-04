-- Add final_image_url for artist-uploaded finished renders (Procreate/Photoshop)
ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS final_image_url TEXT;
