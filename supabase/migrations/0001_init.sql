-- PassPoint Learning Institute — initial schema
--
-- Run this in the Supabase SQL editor (Project → SQL → New query).
-- Or via CLI:  supabase db push
--
-- Model:
--   auth.users        (managed by Supabase)
--   profiles          1:1 with auth.users (display name, class level, avatar)
--   learning_paths    catalog of things a student can subscribe to
--                     (SS3, JAMB, WAEC, NECO, GCE, Primary 4, KG, …)
--   subscriptions     which paths a student has paid for and until when
--   communities       1:1 with learning_paths (SS3 Community, JAMB Community, …)
--   community_posts   messages inside a community
--
-- Row-level security is on for every table. Students can only read/write
-- their own profile + subscriptions. Communities are readable by any user
-- with an active subscription to the matching learning_path.

------------------------------------------------------------------
-- Extensions
------------------------------------------------------------------
create extension if not exists "pgcrypto";

------------------------------------------------------------------
-- profiles: application-level user data (extends auth.users)
------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  class_level  text,               -- e.g. 'SS3', 'JSS 1', 'Primary 4', 'KG'
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, class_level)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'class_level', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------------
-- learning_paths: the products (SS3, JAMB, WAEC, NECO, GCE, …)
------------------------------------------------------------------
create table if not exists public.learning_paths (
  id           text primary key,        -- e.g. 'ss3', 'jamb', 'waec'
  name         text not null,           -- e.g. 'SS3 Curriculum', 'JAMB'
  kind         text not null,           -- 'class' | 'exam'
  description  text,
  icon         text,                    -- emoji or asset key
  color_tint   text,                    -- tailwind class for the tile
  sort_order   int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.learning_paths enable row level security;

-- Catalog is public — anyone signed in can browse what exists.
drop policy if exists "learning_paths: read all" on public.learning_paths;
create policy "learning_paths: read all"
  on public.learning_paths for select
  using (auth.role() = 'authenticated');

-- Seed the catalog. Idempotent via on conflict do update.
insert into public.learning_paths (id, name, kind, description, icon, color_tint, sort_order) values
  ('ss3',   'SS3 Curriculum', 'class', 'Full Senior Secondary 3 syllabus',          '🎓', 'bg-blue-100 text-brand-blue',    10),
  ('ss2',   'SS2 Curriculum', 'class', 'Full Senior Secondary 2 syllabus',          '📘', 'bg-indigo-100 text-indigo-600',  11),
  ('ss1',   'SS1 Curriculum', 'class', 'Full Senior Secondary 1 syllabus',          '📗', 'bg-teal-100 text-teal-600',      12),
  ('jamb',  'JAMB',           'exam',  'Joint Admissions & Matriculation Board',    '🏛️', 'bg-orange-100 text-brand-orange', 20),
  ('waec',  'WAEC',           'exam',  'West African Examinations Council',         '📝', 'bg-emerald-100 text-emerald-600', 21),
  ('neco',  'NECO',           'exam',  'National Examinations Council',             '📓', 'bg-purple-100 text-purple-600',  22),
  ('gce',   'GCE',            'exam',  'General Certificate of Education',          '📜', 'bg-rose-100 text-rose-600',      23)
on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  color_tint  = excluded.color_tint,
  sort_order  = excluded.sort_order;

------------------------------------------------------------------
-- subscriptions: what a student has paid for
------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  learning_path_id  text not null references public.learning_paths(id) on delete restrict,
  status            text not null default 'active',   -- 'active' | 'expired' | 'cancelled'
  started_at        timestamptz not null default now(),
  expires_at        timestamptz,                       -- null = no expiry (dev/demo)
  payment_ref       text,                              -- Paystack reference, later
  created_at        timestamptz not null default now(),
  unique (user_id, learning_path_id)
);

create index if not exists subscriptions_user_idx on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions: read own" on public.subscriptions;
create policy "subscriptions: read own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Writes are done server-side with the service role key (Paystack webhook,
-- admin grant script). No client-side insert/update policy on purpose.

-- Helper: is a given user actively subscribed to a given path?
create or replace function public.has_active_subscription(p_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = auth.uid()
      and learning_path_id = p_path
      and status = 'active'
      and (expires_at is null or expires_at > now())
  );
$$;

------------------------------------------------------------------
-- communities: one per learning_path
------------------------------------------------------------------
create table if not exists public.communities (
  id                uuid primary key default gen_random_uuid(),
  learning_path_id  text not null unique references public.learning_paths(id) on delete cascade,
  name              text not null,
  description       text,
  created_at        timestamptz not null default now()
);

alter table public.communities enable row level security;

-- Any signed-in user can see that a community exists.
drop policy if exists "communities: read all" on public.communities;
create policy "communities: read all"
  on public.communities for select
  using (auth.role() = 'authenticated');

-- Seed one community per learning_path
insert into public.communities (learning_path_id, name, description)
  select id, name || ' Community', 'Academic discussion for ' || name
  from public.learning_paths
on conflict (learning_path_id) do nothing;

------------------------------------------------------------------
-- community_posts: messages in a community
------------------------------------------------------------------
create table if not exists public.community_posts (
  id             uuid primary key default gen_random_uuid(),
  community_id   uuid not null references public.communities(id) on delete cascade,
  author_id      uuid not null references auth.users(id) on delete cascade,
  body           text not null,
  moderation     text not null default 'pending',   -- 'pending' | 'ok' | 'blocked'
  moderation_reason text,
  created_at     timestamptz not null default now()
);

create index if not exists community_posts_community_idx
  on public.community_posts(community_id, created_at desc);

alter table public.community_posts enable row level security;

-- Read: must be subscribed to the matching learning_path AND post must be 'ok'.
drop policy if exists "community_posts: read if subscribed" on public.community_posts;
create policy "community_posts: read if subscribed"
  on public.community_posts for select
  using (
    moderation = 'ok'
    and exists (
      select 1
      from public.communities c
      where c.id = community_id
        and public.has_active_subscription(c.learning_path_id)
    )
  );

-- Write: same subscription check. Author must be the current user.
drop policy if exists "community_posts: insert if subscribed" on public.community_posts;
create policy "community_posts: insert if subscribed"
  on public.community_posts for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1
      from public.communities c
      where c.id = community_id
        and public.has_active_subscription(c.learning_path_id)
    )
  );
