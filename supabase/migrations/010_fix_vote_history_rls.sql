-- ============================================
-- MIGRATION: Fix Vote History RLS Policy
-- ============================================
-- Allow authenticated users to read all vote history,
-- not just their own. This is needed for timeline features.
-- ============================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "read own history" ON public.vote_history;

-- Create a new policy that allows all authenticated users to read all vote history
CREATE POLICY "read all vote history" ON public.vote_history
FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- DONE! Vote history is now readable by all authenticated users.
-- ============================================

