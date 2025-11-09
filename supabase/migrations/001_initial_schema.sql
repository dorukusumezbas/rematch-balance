-- ============================================
-- REMATCH BALANCER - Supabase Schema (MVP)
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. PLAYERS TABLE
-- Stores Discord user information
create table if not exists public.players (
  user_id uuid primary key references auth.users(id) on delete cascade,
  discord_id text unique,
  display_name text,
  avatar_url text,
  joined_at timestamptz default now()
);

-- 2. VOTES TABLE
-- Stores player ratings (1-10)
-- Composite primary key ensures one vote per voter-target pair
create table if not exists public.votes (
  voter_id uuid references auth.users(id) on delete cascade,
  target_id uuid references auth.users(id) on delete cascade,
  score int not null check (score between 1 and 10),
  updated_at timestamptz not null default now(),
  primary key (voter_id, target_id),
  constraint no_self_vote check (voter_id <> target_id)
);

-- 3. TRIGGER TO AUTO-UPDATE TIMESTAMP
create or replace function public.trigger_set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_votes_updated_at on public.votes;
create trigger trg_votes_updated_at
before update on public.votes
for each row execute function public.trigger_set_timestamp();

-- 4. PLAYER RATINGS VIEW
-- Aggregates votes to show average scores and voter counts
create or replace view public.player_ratings as
select
  p.user_id as player_id,
  p.display_name,
  p.avatar_url,
  coalesce(avg(v.score), 0)::numeric(4,2) as avg_score,
  coalesce(count(v.voter_id), 0) as voter_count
from public.players p
left join public.votes v on v.target_id = p.user_id
group by p.user_id, p.display_name, p.avatar_url;

-- 5. ROW LEVEL SECURITY (RLS)
alter table public.players enable row level security;
alter table public.votes enable row level security;

-- Players policies: Anyone authenticated can read; users can insert/update their own record
drop policy if exists "read players" on public.players;
create policy "read players" on public.players
for select using (auth.role() = 'authenticated');

drop policy if exists "insert self player" on public.players;
create policy "insert self player" on public.players
for insert with check (user_id = auth.uid());

drop policy if exists "update self player" on public.players;
create policy "update self player" on public.players
for update using (user_id = auth.uid());

-- Votes policies: Anyone can read; users can only insert/update their own votes
drop policy if exists "read votes" on public.votes;
create policy "read votes" on public.votes
for select using (auth.role() = 'authenticated');

drop policy if exists "insert own votes" on public.votes;
create policy "insert own votes" on public.votes
for insert with check (voter_id = auth.uid() and voter_id <> target_id);

drop policy if exists "update own votes" on public.votes;
create policy "update own votes" on public.votes
for update using (voter_id = auth.uid())
with check (voter_id = auth.uid() and voter_id <> target_id);

-- ============================================
-- DONE! Your database is ready.
-- ============================================

