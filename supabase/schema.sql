-- Betly schema for Supabase.
-- Run this once in the Supabase SQL editor.

-- Extensions ----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Helper: set updated_date on row update -------------------------------------
create or replace function public.set_updated_date()
returns trigger as $$
begin
  new.updated_date := now();
  return new;
end;
$$ language plpgsql;

-- Bets ----------------------------------------------------------------------
-- status values: 'active' | 'pending_review' | 'completed' | 'failed' | 'rejected'
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  title text not null,
  description text,
  category text not null,
  stake_amount numeric not null,
  duration_days integer not null,
  deadline timestamptz not null,
  status text not null default 'active',
  proof_url text,
  proof_type text default 'any',
  proof_note text,
  proof_submitted_at timestamptz,
  rejection_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  close_mode text default 'medium',
  reward_amount numeric default 0,
  difficulty text default 'medium',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.bets add column if not exists proof_note text;
alter table public.bets add column if not exists proof_submitted_at timestamptz;
alter table public.bets add column if not exists rejection_reason text;
alter table public.bets add column if not exists reviewed_by text;
alter table public.bets add column if not exists reviewed_at timestamptz;
create index if not exists bets_user_email_idx on public.bets (user_email);
create index if not exists bets_status_idx on public.bets (status);
create index if not exists bets_pending_review_idx on public.bets (status, proof_submitted_at)
  where status = 'pending_review';
drop trigger if exists set_bets_updated on public.bets;
create trigger set_bets_updated before update on public.bets
  for each row execute function public.set_updated_date();

-- User profiles -------------------------------------------------------------
create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_email text not null unique,
  tg_id text,
  tg_username text,
  tg_photo_url text,
  tg_friends_ids text[] default '{}',
  gems_balance numeric default 500,
  total_gems_earned numeric default 0,
  total_gems_lost numeric default 0,
  bets_won integer default 0,
  bets_lost integer default 0,
  current_streak integer default 0,
  best_streak integer default 0,
  level integer default 1,
  xp integer default 0,
  achievements text[] default '{}',
  display_name text,
  avatar_emoji text default '🎮',
  is_admin boolean default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
alter table public.user_profiles add column if not exists is_admin boolean default false;
alter table public.user_profiles add column if not exists claimed_battle_pass_rewards integer[] default '{}';
create index if not exists user_profiles_tg_id_idx on public.user_profiles (tg_id);
create index if not exists user_profiles_is_admin_idx on public.user_profiles (is_admin)
  where is_admin = true;
drop trigger if exists set_user_profiles_updated on public.user_profiles;
create trigger set_user_profiles_updated before update on public.user_profiles
  for each row execute function public.set_updated_date();

-- Community bets ------------------------------------------------------------
create table if not exists public.community_bets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  creator_email text not null,
  creator_tg_id text,
  stake_amount numeric not null,
  duration_days integer not null,
  difficulty text default 'medium',
  proof_type text default 'any',
  status text default 'pending',
  creator_revenue_pct numeric default 10,
  participants_count integer default 0,
  total_pool numeric default 0,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
drop trigger if exists set_community_bets_updated on public.community_bets;
create trigger set_community_bets_updated before update on public.community_bets
  for each row execute function public.set_updated_date();

-- Exchange requests ---------------------------------------------------------
-- status values: 'pending' | 'approved' | 'rejected'
create table if not exists public.exchange_requests (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  tg_id text,
  tg_username text,
  gems_amount numeric not null,
  ton_amount numeric not null,
  wallet_address text not null,
  status text not null default 'pending',
  rejection_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index if not exists exchange_requests_user_email_idx on public.exchange_requests (user_email);
create index if not exists exchange_requests_status_idx on public.exchange_requests (status);
drop trigger if exists set_exchange_requests_updated on public.exchange_requests;
create trigger set_exchange_requests_updated before update on public.exchange_requests
  for each row execute function public.set_updated_date();

-- Missions ------------------------------------------------------------------
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  type text not null,
  reward_gems numeric not null,
  icon text,
  requirement_type text not null,
  requirement_value numeric default 1,
  is_active boolean default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  mission_id text not null,
  progress numeric default 0,
  completed boolean default false,
  claimed boolean default false,
  completed_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index if not exists user_missions_user_email_idx on public.user_missions (user_email);
drop trigger if exists set_user_missions_updated on public.user_missions;
create trigger set_user_missions_updated before update on public.user_missions
  for each row execute function public.set_updated_date();

-- Row Level Security --------------------------------------------------------
alter table public.bets enable row level security;
alter table public.user_profiles enable row level security;
alter table public.community_bets enable row level security;
alter table public.missions enable row level security;
alter table public.user_missions enable row level security;
alter table public.exchange_requests enable row level security;

-- Helper to get the logged-in user's email from the JWT.
create or replace function public.auth_email() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::json->>'email', ''),
    (auth.jwt() ->> 'email')
  );
$$;

-- Helper: is the logged-in user a moderator/admin? Looked up by user_email.
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_profiles
    where user_email = public.auth_email() and coalesce(is_admin, false) = true
  );
$$;

-- Bets: a user can read/write only their own rows.
-- Admins can read every bet (for the moderation queue) and update them.
drop policy if exists bets_select on public.bets;
create policy bets_select on public.bets for select
  using (user_email = public.auth_email() or public.is_admin());
drop policy if exists bets_insert on public.bets;
create policy bets_insert on public.bets for insert
  with check (user_email = public.auth_email());
drop policy if exists bets_update on public.bets;
create policy bets_update on public.bets for update
  using (user_email = public.auth_email() or public.is_admin())
  with check (user_email = public.auth_email() or public.is_admin());
drop policy if exists bets_delete on public.bets;
create policy bets_delete on public.bets for delete
  using (user_email = public.auth_email());

-- User profiles: a user can read all (for leaderboard) but only edit their own.
drop policy if exists user_profiles_select on public.user_profiles;
create policy user_profiles_select on public.user_profiles for select
  using (true);
drop policy if exists user_profiles_insert on public.user_profiles;
create policy user_profiles_insert on public.user_profiles for insert
  with check (user_email = public.auth_email());
drop policy if exists user_profiles_update on public.user_profiles;
create policy user_profiles_update on public.user_profiles for update
  using (user_email = public.auth_email())
  with check (user_email = public.auth_email());

-- Community bets: anyone can read approved/own; admins see everything.
-- Inserts only as oneself; updates by owner, admin, or anyone (for counters
-- on approved rows — the participant join flow updates total_pool).
drop policy if exists community_bets_select on public.community_bets;
create policy community_bets_select on public.community_bets for select
  using (status = 'approved' or creator_email = public.auth_email() or public.is_admin());
drop policy if exists community_bets_insert on public.community_bets;
create policy community_bets_insert on public.community_bets for insert
  with check (creator_email = public.auth_email());
drop policy if exists community_bets_update on public.community_bets;
create policy community_bets_update on public.community_bets for update
  using (creator_email = public.auth_email() or status = 'approved' or public.is_admin())
  with check (true);

-- Exchange requests: a user can see their own; admins see everything.
-- Inserts only as oneself; updates only by admins (moderation verdict).
drop policy if exists exchange_requests_select on public.exchange_requests;
create policy exchange_requests_select on public.exchange_requests for select
  using (user_email = public.auth_email() or public.is_admin());
drop policy if exists exchange_requests_insert on public.exchange_requests;
create policy exchange_requests_insert on public.exchange_requests for insert
  with check (user_email = public.auth_email());
drop policy if exists exchange_requests_update on public.exchange_requests;
create policy exchange_requests_update on public.exchange_requests for update
  using (public.is_admin())
  with check (public.is_admin());

-- Missions: world-readable catalog, writes only via service role.
drop policy if exists missions_select on public.missions;
create policy missions_select on public.missions for select using (true);

-- User missions: a user can only access their own.
drop policy if exists user_missions_select on public.user_missions;
create policy user_missions_select on public.user_missions for select
  using (user_email = public.auth_email());
drop policy if exists user_missions_insert on public.user_missions;
create policy user_missions_insert on public.user_missions for insert
  with check (user_email = public.auth_email());
drop policy if exists user_missions_update on public.user_missions;
create policy user_missions_update on public.user_missions for update
  using (user_email = public.auth_email())
  with check (user_email = public.auth_email());
drop policy if exists user_missions_delete on public.user_missions;
create policy user_missions_delete on public.user_missions for delete
  using (user_email = public.auth_email());

-- How to promote a user to moderator/admin:
--   update public.user_profiles set is_admin = true where user_email = 'tg_<TG_ID>@betly.app';
-- (Run from the Supabase SQL editor as the service role.)

-- ---------------------------------------------------------------------------
-- Storage: private bucket for proof files.
-- Privacy model:
--   • Users upload to the "proofs" bucket but cannot read or list any file.
--   • Moderators read proof files only via signed URLs generated server-side
--     by /api/getProofUrl (service role bypasses RLS, so no SELECT policy
--     is needed for moderators).
--   • After a moderator approves or rejects a bet, /api/moderateBet deletes
--     the file from storage with the service role and nulls bets.proof_url.
-- ---------------------------------------------------------------------------

-- Delete old public bucket policies if they exist
drop policy if exists "Allow public read" on storage.objects;
drop policy if exists "Proofs: authenticated uploads" on storage.objects;
drop policy if exists "Proofs: authenticated select" on storage.objects;
drop policy if exists "Proofs: authenticated delete own" on storage.objects;

-- Create private proofs bucket (or make sure existing one is private)
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do update set public = false;

-- Authenticated users can upload (writes) into the proofs bucket only.
create policy "Proofs: authenticated uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs');

-- Nobody can SELECT through RLS — moderators read via signed URLs
-- generated on the server with the service-role key.
-- (No SELECT policy intentionally — service role bypasses RLS.)

-- Nobody can DELETE through RLS — /api/moderateBet deletes via the
-- service-role key after a moderation verdict.
-- (No DELETE policy intentionally — service role bypasses RLS.)
