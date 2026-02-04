-- Add role and studio_id to profiles for Studio Admin assignment
-- Run this in Supabase SQL Editor if you get "column profiles.role does not exist"
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER',
ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES public.studios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_studio_id ON public.profiles(studio_id);

COMMENT ON COLUMN public.profiles.role IS 'USER or STUDIO_ADMIN';
COMMENT ON COLUMN public.profiles.studio_id IS 'Set for STUDIO_ADMIN: the studio this profile administers';
