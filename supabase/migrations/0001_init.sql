-- FunCoin Lab schema. Every row belongs to a user; row-level security enforces it.
-- Run with `supabase db push` or paste into the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- users (profile mirror of auth.users) ----------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- projects ----------
create table if not exists public.projects (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  ticker text,
  domain text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  concept_input jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects (user_id, updated_at desc);

-- Every generated concept (saved or not) — powers "Ideas Created".
create table if not exists public.meme_ideas (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.users (id) on delete cascade,
  project_id text references public.projects (id) on delete set null,
  input jsonb not null,
  output jsonb not null,
  source text not null default 'local',
  created_at timestamptz not null default now()
);
create index if not exists meme_ideas_user_idx on public.meme_ideas (user_id, created_at desc);

create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id text not null unique references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.domain_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  project_id text references public.projects (id) on delete set null,
  domain text not null,
  topic text,
  status text not null default 'unchecked',
  saved boolean not null default true,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, domain)
);

create table if not exists public.website_projects (
  id uuid primary key default gen_random_uuid(),
  project_id text not null unique references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,64}$'),
  config jsonb not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meme_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  project_id text references public.projects (id) on delete set null,
  input jsonb not null,
  output jsonb not null,
  source text not null default 'local',
  created_at timestamptz not null default now()
);

create table if not exists public.social_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  project_id text references public.projects (id) on delete set null,
  kind text not null check (kind in ('bios', 'content')),
  platform text,
  content_type text,
  input jsonb not null,
  output jsonb not null,
  source text not null default 'local',
  created_at timestamptz not null default now()
);

-- Bookmarks: ideas saved from the Discover universe or elsewhere.
create table if not exists public.saved_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  source text not null default 'discover',
  ref text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, source, ref)
);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array['users', 'projects', 'brand_profiles', 'website_projects'] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------- row-level security ----------
alter table public.users enable row level security;
create policy "users: read own" on public.users for select using (auth.uid() = id);
create policy "users: update own" on public.users for update using (auth.uid() = id);

do $$
declare t text;
begin
  foreach t in array array[
    'projects', 'meme_ideas', 'brand_profiles', 'domain_ideas', 'website_projects',
    'meme_generations', 'social_generations', 'saved_projects'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: owner all" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
  end loop;
end $$;

-- Published websites are public (served at /site/<slug>).
create policy "website_projects: public read published"
  on public.website_projects for select using (is_published = true);
