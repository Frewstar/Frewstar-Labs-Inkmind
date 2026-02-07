-- Collections and collection_id for designs (migrate gallery from localStorage to Supabase)

-- 1. Collections table
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_profile_name ON public.collections(profile_id, name);
CREATE INDEX IF NOT EXISTS idx_collections_profile_id ON public.collections(profile_id);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections"
  ON public.collections FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = profile_id);

-- 2. Add collection_id to designs
ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_designs_collection_id ON public.designs(collection_id);
CREATE INDEX IF NOT EXISTS idx_designs_is_starred ON public.designs(is_starred);

-- 3. Default "General" collection for existing users (one per profile that has designs)
INSERT INTO public.collections (profile_id, name)
SELECT DISTINCT d.profile_id, 'General'
FROM public.designs d
WHERE d.profile_id IS NOT NULL
ON CONFLICT (profile_id, name) DO NOTHING;

COMMENT ON TABLE public.collections IS 'User collections (galleries) for organizing saved designs.';
COMMENT ON COLUMN public.designs.collection_id IS 'Optional collection this design belongs to.';
