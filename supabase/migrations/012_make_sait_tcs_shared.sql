-- Migration 012: Make sait_tcs a shared list (remove user_id, update RLS)
-- Purpose: Change from per-user TCs to a single shared list that only admins can edit

-- Drop old policies
drop policy if exists "Users can read all TCs" on public.sait_tcs;
drop policy if exists "Users can insert their own TCs" on public.sait_tcs;
drop policy if exists "Users can update their own TCs" on public.sait_tcs;
drop policy if exists "Users can delete their own TCs" on public.sait_tcs;

-- Drop user_id column and its index
drop index if exists sait_tcs_user_id_idx;
alter table public.sait_tcs drop column if exists user_id;

-- Create new RLS policies for shared list
create policy "Everyone can read all TCs"
  on public.sait_tcs for select
  using (auth.role() = 'authenticated');

create policy "Only admins can insert TCs"
  on public.sait_tcs for insert
  with check (
    exists (
      select 1 from public.players
      where players.user_id = auth.uid()
      and players.is_admin = true
    )
  );

create policy "Only admins can update TCs"
  on public.sait_tcs for update
  using (
    exists (
      select 1 from public.players
      where players.user_id = auth.uid()
      and players.is_admin = true
    )
  );

create policy "Only admins can delete TCs"
  on public.sait_tcs for delete
  using (
    exists (
      select 1 from public.players
      where players.user_id = auth.uid()
      and players.is_admin = true
    )
  );

