-- Migration 011: Create Sait's TC (Town Centers) ranking table
-- Purpose: Allow Sait to rank and order his various town centers (houses he stays at)

-- Create sait_tcs table
create table if not exists public.sait_tcs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tc_name text not null,
  score numeric(4,2) not null check (score >= 0.0 and score <= 10.0),
  display_order int not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.sait_tcs enable row level security;

-- RLS Policies
create policy "Users can read all TCs"
  on public.sait_tcs for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own TCs"
  on public.sait_tcs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own TCs"
  on public.sait_tcs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own TCs"
  on public.sait_tcs for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists sait_tcs_user_id_idx on public.sait_tcs(user_id);
create index if not exists sait_tcs_display_order_idx on public.sait_tcs(display_order);

