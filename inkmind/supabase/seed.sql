-- 1. Create Test Studio
INSERT INTO public.studios (id, name, slug, ai_name, ai_personality_prompt, style_adherence)
VALUES (
  '00000000-0000-0000-0000-000000000000', 
  'Your Studio', 
  'your', 
  'Ross', 
  'A master of traditional and fine-line tattooing.', 
  3.0
)
ON CONFLICT (slug) DO UPDATE SET 
  ai_personality_prompt = EXCLUDED.ai_personality_prompt;

-- 2. Collections will be created by users when they sign up
-- No need to seed them - they're user-specific
