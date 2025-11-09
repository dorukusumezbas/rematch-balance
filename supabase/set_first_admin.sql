-- ============================================
-- SET FIRST ADMIN
-- ============================================
-- Replace YOUR_USER_ID with your actual Discord user ID from auth.users
-- You can find it by running: SELECT id, email FROM auth.users;
-- Or check the URL when you're logged in
-- ============================================

-- STEP 1: Find your user_id (run this first to get your ID)
-- SELECT user_id, display_name, discord_id FROM public.players;

-- STEP 2: Replace 'YOUR_USER_ID_HERE' below with your actual user_id and run
update public.players
set is_admin = true
where user_id = 'YOUR_USER_ID_HERE';

-- Verify it worked
select display_name, is_admin from public.players where is_admin = true;

-- ============================================
-- You are now an admin! You can manage other users from /admin page
-- ============================================

