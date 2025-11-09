-- ============================================
-- MIGRATION: Change Score from Integer to Decimal
-- ============================================
-- Allow fractional scores (0.25 granularity)
-- ============================================

-- 1. DROP THE VIEW (it depends on votes.score)
drop view if exists public.player_ratings;

-- 2. UPDATE VOTES TABLE
-- Change score from int to numeric(3,2) which allows values like 7.25
alter table public.votes 
alter column score type numeric(3,2) using score::numeric(3,2);

-- Drop old constraint and add new one for decimal range
alter table public.votes 
drop constraint if exists votes_score_check;

alter table public.votes 
add constraint votes_score_check check (score >= 1.0 and score <= 10.0);

-- 3. UPDATE VOTE_HISTORY TABLE
alter table public.vote_history 
alter column score type numeric(3,2) using score::numeric(3,2);

-- Drop old constraint and add new one
alter table public.vote_history 
drop constraint if exists vote_history_score_check;

alter table public.vote_history 
add constraint vote_history_score_check check (score >= 1.0 and score <= 10.0);

-- 4. RECREATE THE VIEW WITH DECIMAL SUPPORT
create or replace view public.player_ratings as
select
  p.user_id as player_id,
  coalesce(p.custom_name, p.display_name, 'Unknown Player') as display_name,
  p.avatar_url,
  coalesce(avg(v.score), 0)::numeric(4,2) as avg_score,
  coalesce(count(v.voter_id), 0) as voter_count
from public.players p
left join public.votes v on v.target_id = p.user_id
group by p.user_id, p.custom_name, p.display_name, p.avatar_url;

-- ============================================
-- DONE! Scores now support decimal values (1.00 to 10.00)
-- ============================================

