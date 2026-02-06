-- This ensures 'your' always exists even after a reset
INSERT INTO public.studios (id, name, slug, ai_name, ai_personality_prompt, style_adherence)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Static UUID for testing
  'Your Studio', 
  'your', 
  'Ross', 
  'A master of traditional and fine-line tattooing.', 
  3.0
)
ON CONFLICT (slug) DO NOTHING;