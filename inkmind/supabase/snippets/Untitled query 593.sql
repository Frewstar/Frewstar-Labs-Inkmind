ALTER TABLE public.studios 
ADD COLUMN IF NOT EXISTS ai_name text DEFAULT 'Ross',
ADD COLUMN IF NOT EXISTS ai_personality_prompt text,
ADD COLUMN IF NOT EXISTS style_adherence double precision DEFAULT 3.0;
