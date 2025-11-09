-- ============================================
-- MIGRATION: Add Custom Player Names
-- ============================================
-- Run this in Supabase SQL Editor to add custom name feature
-- ============================================

-- Add custom_name column to players table
alter table public.players 
add column if not exists custom_name text;

-- Update the player_ratings view to use custom_name if available, otherwise discord name
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
-- DONE! Now players can set custom names.
-- ============================================

