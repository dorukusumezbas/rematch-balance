-- ============================================
-- MIGRATION: Add Vote History Tracking
-- ============================================
-- Track every vote change with timestamps for audit trail
-- ============================================

-- 1. CREATE VOTE HISTORY TABLE
create table if not exists public.vote_history (
  id bigserial primary key,
  voter_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  score int not null check (score between 1 and 10),
  created_at timestamptz not null default now()
);

-- 2. ADD INDEX FOR EFFICIENT QUERIES
create index if not exists idx_vote_history_voter 
on public.vote_history(voter_id, created_at desc);

create index if not exists idx_vote_history_target 
on public.vote_history(target_id, created_at desc);

-- 3. TRIGGER TO AUTO-LOG VOTE CHANGES
-- This trigger runs AFTER insert or update on votes table
-- and creates a history entry automatically
create or replace function public.log_vote_history()
returns trigger language plpgsql as $$
begin
  insert into public.vote_history(voter_id, target_id, score, created_at)
  values (new.voter_id, new.target_id, new.score, now());
  return new;
end $$;

drop trigger if exists trg_votes_history on public.votes;
create trigger trg_votes_history
after insert or update on public.votes
for each row execute function public.log_vote_history();

-- 4. ROW LEVEL SECURITY
alter table public.vote_history enable row level security;

-- Users can read their own vote history
drop policy if exists "read own history" on public.vote_history;
create policy "read own history" on public.vote_history
for select using (voter_id = auth.uid());

-- Trigger will insert, so we need a permissive policy for the function
drop policy if exists "insert history via trigger" on public.vote_history;
create policy "insert history via trigger" on public.vote_history
for insert with check (voter_id = auth.uid());

-- ============================================
-- DONE! Vote history is now tracked automatically.
-- ============================================

