UPDATE public.profiles 
SET is_admin = TRUE, 
    role = 'SUPER_ADMIN' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'joseph.frew@googlemail.com');