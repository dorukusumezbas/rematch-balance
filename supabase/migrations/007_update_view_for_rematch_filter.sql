-- ============================================
-- MIGRATION: Update player_ratings view to include plays_rematch
-- ============================================
-- Add plays_rematch to view so we can filter non-active players
-- ============================================

-- Drop and recreate the view with plays_rematch
drop view if exists public.player_ratings;

create or replace view public.player_ratings as
select
  p.user_id as player_id,
  coalesce(p.custom_name, p.display_name, 'Unknown Player') as display_name,
  p.avatar_url,
  p.plays_rematch,
  coalesce(avg(v.score), 0)::numeric(4,2) as avg_score,
  coalesce(count(v.voter_id), 0) as voter_count
from public.players p
left join public.votes v on v.target_id = p.user_id
group by p.user_id, p.custom_name, p.display_name, p.avatar_url, p.plays_rematch;

-- ============================================
-- DONE! Now views can filter by plays_rematch
-- ============================================

