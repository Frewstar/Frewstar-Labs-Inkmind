UPDATE public.profiles 
SET role = 'STUDIO_ADMIN', 
    studio_id = '00000000-0000-0000-0000-000000000000' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'borntoparty306@gmail.com');