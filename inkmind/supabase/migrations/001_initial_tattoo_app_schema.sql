-- InkMind multi-tenant tattoo app - Supabase backend setup
-- Run in Supabase: SQL Editor -> New query -> Paste -> Run

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_generations INT NOT NULL DEFAULT 5,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase Auth; tracks generation limits and admin flag.';

-- 2. STUDIOS (multi-tenant)
CREATE TABLE IF NOT EXISTS public.studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  logo_url TEXT,
  theme_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS studios_slug_key ON public.studios(slug);
COMMENT ON TABLE public.studios IS 'Tattoo studios; slug used for subdomain/routing; theme_config for branding.';

-- 3. DESIGNS (linked to profiles + studios)
CREATE TABLE IF NOT EXISTS public.designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  image_url TEXT,
  prompt TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS designs_profile_id_idx ON public.designs(profile_id);
CREATE INDEX IF NOT EXISTS designs_studio_id_idx ON public.designs(studio_id);
CREATE INDEX IF NOT EXISTS designs_status_idx ON public.designs(status);
COMMENT ON TABLE public.designs IS 'AI-generated designs; owned by a profile and scoped to a studio.';

-- 4. AUTO-PROFILE: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, daily_generations, is_admin)
  VALUES (NEW.id, 5, FALSE);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a profiles row when a new user signs up via Supabase Auth.';

-- 5. ROW LEVEL SECURITY (RLS) - permissive for testing
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Profiles: permissive - allow all for authenticated users (testing)
DROP POLICY IF EXISTS "profiles_permissive_authenticated" ON public.profiles;
CREATE POLICY "profiles_permissive_authenticated"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Studios: permissive - allow all for authenticated (testing)
DROP POLICY IF EXISTS "studios_permissive_authenticated" ON public.studios;
CREATE POLICY "studios_permissive_authenticated"
  ON public.studios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Designs: permissive - allow all for authenticated (testing)
DROP POLICY IF EXISTS "designs_permissive_authenticated" ON public.designs;
CREATE POLICY "designs_permissive_authenticated"
  ON public.designs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Optional: allow anon read on studios for public studio pages (e.g. by slug)
DROP POLICY IF EXISTS "studios_anon_read" ON public.studios;
CREATE POLICY "studios_anon_read"
  ON public.studios
  FOR SELECT
  TO anon
  USING (true);

-- 6. (Optional) updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_updated_at') THEN
    CREATE TRIGGER profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'studios_updated_at') THEN
    CREATE TRIGGER studios_updated_at
      BEFORE UPDATE ON public.studios
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'designs_updated_at') THEN
    CREATE TRIGGER designs_updated_at
      BEFORE UPDATE ON public.designs
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
  END IF;
END $$;

-- Done. For production, tighten RLS (e.g. profile_id = auth.uid()).
