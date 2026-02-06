-- Add is_starred, iteration_strength, is_visible_to_client to designs (synced with Prisma schema)
ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS iteration_strength DOUBLE PRECISION DEFAULT 0.7;

ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS is_visible_to_client BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.designs.is_starred IS 'User/artist starred (favorite) flag.';
COMMENT ON COLUMN public.designs.iteration_strength IS 'Edit strength 0–1 when derived from parent design.';
COMMENT ON COLUMN public.designs.is_visible_to_client IS 'Artist can reveal final tattoo render to client.';
