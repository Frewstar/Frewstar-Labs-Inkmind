-- Replace 'your-email@example.com' with your actual email
UPDATE public.profiles
SET 
  is_admin = TRUE,
  role = 'SUPER_ADMIN'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'joseph.frew@googlemail.com'
);