-- Add parent_id to designs for edit/history chain (design derived from another)
ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS parent_id uuid NULL
  REFERENCES public.designs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_designs_parent_id ON public.designs(parent_id);

COMMENT ON COLUMN public.designs.parent_id IS 'Design this was edited from (image_url of parent used as reference).';
