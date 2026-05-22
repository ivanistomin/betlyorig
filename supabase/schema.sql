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
  close_mode text default 'medium',
  reward_amount numeric default 0,
  difficulty text default 'medium',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index if not exists bets_user_email_idx on public.bets (user_email);
create index if not exists bets_status_idx on public.bets (status);
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
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index if not exists user_profiles_tg_id_idx on public.user_profiles (tg_id);
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

-- Helper to get the logged-in user's email from the JWT.
create or replace function public.auth_email() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::json->>'email', ''),
    (auth.jwt() ->> 'email')
  );
$$;

-- Bets: a user can read/write only their own rows.
drop policy if exists bets_select on public.bets;
create policy bets_select on public.bets for select
  using (user_email = public.auth_email());
drop policy if exists bets_insert on public.bets;
create policy bets_insert on public.bets for insert
  with check (user_email = public.auth_email());
drop policy if exists bets_update on public.bets;
create policy bets_update on public.bets for update
  using (user_email = public.auth_email())
  with check (user_email = public.auth_email());
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

-- Community bets: anyone can read approved/own; insert only as oneself.
drop policy if exists community_bets_select on public.community_bets;
create policy community_bets_select on public.community_bets for select
  using (status = 'approved' or creator_email = public.auth_email());
drop policy if exists community_bets_insert on public.community_bets;
create policy community_bets_insert on public.community_bets for insert
  with check (creator_email = public.auth_email());
drop policy if exists community_bets_update on public.community_bets;
create policy community_bets_update on public.community_bets for update
  using (creator_email = public.auth_email() or status = 'approved')
  with check (true);

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
