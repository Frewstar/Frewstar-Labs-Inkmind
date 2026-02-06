-- Reset daily generation quota (run in Supabase SQL Editor when you hit "Quota exceeded")
-- Option A: Reset your own profile (replace YOUR_USER_ID with your auth.users id)
-- UPDATE public.profiles SET daily_generations = 5 WHERE id = 'YOUR_USER_ID';

-- Option B: Reset all profiles to 5 free generations
UPDATE public.profiles SET daily_generations = 5;

-- Option C: Give one user unlimited (exempt): set role to PRO or SUPER_ADMIN, or is_admin = true
-- UPDATE public.profiles SET role = 'SUPER_ADMIN' WHERE id = 'YOUR_USER_ID';
