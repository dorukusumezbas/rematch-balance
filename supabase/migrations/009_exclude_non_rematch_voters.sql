-- Migration: Exclude non-rematch players from vote calculations
-- This migration updates the player_ratings view to only count votes
-- FROM players who actively play rematch (plays_rematch = true)

-- Drop and recreate the view
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
left join public.players voters on voters.user_id = v.voter_id
where voters.plays_rematch = true or v.voter_id is null
group by p.user_id, p.custom_name, p.display_name, p.avatar_url, p.plays_rematch;

-- Note: This ensures that only votes from active rematch players count toward averages
-- Players who mark themselves as "not playing rematch" won't affect others' ratings

