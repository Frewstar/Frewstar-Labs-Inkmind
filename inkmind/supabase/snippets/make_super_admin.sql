-- Make a user a Super Admin (run in Supabase SQL Editor)
-- You still log in with your normal email/password; Super Admin is a role in the DB.

-- 1. Find your user id:
--    Supabase Dashboard → Authentication → Users → click your user → copy the UUID.

-- 2. Run this (replace YOUR_USER_ID with that UUID):
UPDATE public.profiles
SET role = 'SUPER_ADMIN', is_admin = true
WHERE id = 'YOUR_USER_ID';

-- 3. Sign out and sign back in (or refresh) so the app picks up the new role.
-- 4. Go to /admin — you’ll have full admin and Super Admin nav (studios, users, designs, analytics, settings).
