-- Add submitted_at and ross_reasoning for "Send to Artist" flow
ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ross_reasoning TEXT;

COMMENT ON COLUMN public.designs.submitted_at IS 'When the client submitted this design for artist review.';
COMMENT ON COLUMN public.designs.ross_reasoning IS 'Ross technical evaluation / reasoning shown to the artist.';
