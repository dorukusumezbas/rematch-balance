-- Migration 011: Create Sait's TC (Town Centers) ranking table
-- Purpose: Allow Sait to rank and order his various town centers (houses he stays at)

-- Create sait_tcs table (shared list, everyone can view, only admins can edit)
create table if not exists public.sait_tcs (
  id uuid default gen_random_uuid() primary key,
  tc_name text not null,
  score numeric(4,2) not null check (score >= 0.0 and score <= 10.0),
  display_order int not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.sait_tcs enable row level security;

-- RLS Policies
-- Everyone can read all TCs
create policy "Everyone can read all TCs"
  on public.sait_tcs for select
  using (auth.role() = 'authenticated');

-- Only admins can insert TCs
create policy "Only admins can insert TCs"
  on public.sait_tcs for insert
  with check (
    exists (
      select 1 from public.players
      where players.user_id = auth.uid()
      and players.is_admin = true
    )
  );

-- Only admins can update TCs
create policy "Only admins can update TCs"
  on public.sait_tcs for update
  using (
    exists (
      select 1 from public.players
      where players.user_id = auth.uid()
      and players.is_admin = true
    )
  );

-- Only admins can delete TCs
create policy "Only admins can delete TCs"
  on public.sait_tcs for delete
  using (
    exists (
      select 1 from public.players
      where players.user_id = auth.uid()
      and players.is_admin = true
    )
  );

-- Create index for faster queries
create index if not exists sait_tcs_display_order_idx on public.sait_tcs(display_order);

