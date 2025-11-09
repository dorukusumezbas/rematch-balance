-- ============================================
-- MIGRATION: Add plays_rematch and is_admin flags
-- ============================================
-- plays_rematch: Player can toggle if they play rematch games
-- is_admin: Admin flag for managing other players
-- ============================================

-- Add new columns to players table
alter table public.players
add column if not exists plays_rematch boolean default true;

alter table public.players
add column if not exists is_admin boolean default false;

-- Create index for faster admin queries
create index if not exists idx_players_is_admin 
on public.players(is_admin) where is_admin = true;

-- Create index for faster rematch player queries
create index if not exists idx_players_plays_rematch 
on public.players(plays_rematch) where plays_rematch = true;

-- Update RLS policies to allow admins to update other players' flags
-- First, create a helper function to check if user is admin
create or replace function public.is_admin(user_id uuid)
returns boolean as $$
  select exists(
    select 1 from public.players
    where players.user_id = is_admin.user_id
    and players.is_admin = true
  );
$$ language sql security definer;

-- Update the players update policy to allow admins
drop policy if exists "Users can update own profile" on public.players;

create policy "Users can update own profile or admins can update anyone"
on public.players for update
using (
  auth.uid() = user_id 
  or 
  public.is_admin(auth.uid())
)
with check (
  auth.uid() = user_id 
  or 
  public.is_admin(auth.uid())
);

-- NOTE: Admins can update ALL fields for any player including:
-- - plays_rematch (toggle if player is active)
-- - is_admin (promote/demote other admins)
-- - custom_name, etc.
-- Users can only update their own profile (custom_name, plays_rematch)

-- ============================================
-- DONE! 
-- Now run set_first_admin.sql with your user_id to make yourself admin
-- ============================================

