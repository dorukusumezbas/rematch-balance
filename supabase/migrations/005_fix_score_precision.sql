-- ============================================
-- MIGRATION: Fix Score Precision to Support 10.00
-- ============================================
-- Change numeric(3,2) to numeric(4,2) to support 10.00
-- ============================================

-- 1. DROP THE VIEW (it depends on votes.score)
drop view if exists public.player_ratings;

-- 2. UPDATE VOTES TABLE
-- Change score from numeric(3,2) to numeric(4,2) to support 10.00
alter table public.votes 
alter column score type numeric(4,2) using score::numeric(4,2);

-- 3. UPDATE VOTE_HISTORY TABLE
alter table public.vote_history 
alter column score type numeric(4,2) using score::numeric(4,2);

-- 4. RECREATE THE VIEW
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
-- DONE! Now supports 1.00 to 10.00
-- ============================================

