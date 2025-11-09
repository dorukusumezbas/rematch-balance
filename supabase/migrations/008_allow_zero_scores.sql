-- Migration: Allow zero (0) as a valid score
-- This migration updates the CHECK constraints on votes and vote_history tables
-- to allow scores from 0.0 to 10.0 instead of 1.0 to 10.0

-- Drop and recreate constraint on votes table
alter table if exists public.votes
drop constraint if exists votes_score_check;

alter table if exists public.votes
add constraint votes_score_check check (score >= 0.0 and score <= 10.0);

-- Drop and recreate constraint on vote_history table
alter table if exists public.vote_history
drop constraint if exists vote_history_score_check;

alter table if exists public.vote_history
add constraint vote_history_score_check check (score >= 0.0 and score <= 10.0);

