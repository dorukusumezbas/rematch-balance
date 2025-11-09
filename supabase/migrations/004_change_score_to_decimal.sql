-- ============================================
-- MIGRATION: Change Score from Integer to Decimal
-- ============================================
-- Allow fractional scores (0.25 granularity)
-- ============================================

-- 1. UPDATE VOTES TABLE
-- Change score from int to numeric(3,2) which allows values like 7.25
alter table public.votes 
alter column score type numeric(3,2) using score::numeric(3,2);

-- Drop old constraint and add new one for decimal range
alter table public.votes 
drop constraint if exists votes_score_check;

alter table public.votes 
add constraint votes_score_check check (score >= 1.0 and score <= 10.0);

-- 2. UPDATE VOTE_HISTORY TABLE
alter table public.vote_history 
alter column score type numeric(3,2) using score::numeric(3,2);

-- Drop old constraint and add new one
alter table public.vote_history 
drop constraint if exists vote_history_score_check;

alter table public.vote_history 
add constraint vote_history_score_check check (score >= 1.0 and score <= 10.0);

-- ============================================
-- DONE! Scores now support decimal values (1.00 to 10.00)
-- ============================================

