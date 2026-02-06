-- Add missing columns to Studios
ALTER TABLE public.studios 
ADD COLUMN IF NOT EXISTS ai_name text DEFAULT 'Ross',
ADD COLUMN IF NOT EXISTS ai_personality_prompt text,
ADD COLUMN IF NOT EXISTS artist_voice_tone text,
ADD COLUMN IF NOT EXISTS style_adherence double precision DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS studio_specialties text[] DEFAULT '{}';

-- Add missing columns to Designs
ALTER TABLE public.designs 
ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS iteration_strength double precision,
ADD COLUMN IF NOT EXISTS is_visible_to_client boolean DEFAULT false;