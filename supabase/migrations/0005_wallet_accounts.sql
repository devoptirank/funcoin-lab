-- Wallet-only accounts. There are no email accounts any more: every row belongs to a billing account
-- ("sol:<wallet address>") and is read and written only by the server with the service role.
-- Replaces the auth.users-based tables from 0001/0002/0003 (they were empty when this shipped).

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.saved_projects cascade;
drop table if exists public.social_generations cascade;
drop table if exists public.meme_generations cascade;
drop table if exists public.website_projects cascade;
drop table if exists public.domain_ideas cascade;
drop table if exists public.brand_profiles cascade;
drop table if exists public.meme_ideas cascade;
drop table if exists public.generated_assets cascade;
drop table if exists public.domain_clicks cascade;
drop table if exists public.projects cascade;
drop table if exists public.users cascade;

-- A saved meme brand and its website.
create table public.projects (
  id text primary key,
  account_id text not null references public.billing_accounts (id) on delete cascade,
  name text not null,
  concept jsonb not null,
  site jsonb,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,64}$'),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_account_idx on public.projects (account_id, updated_at desc);
create index projects_published_idx on public.projects (slug) where published;

create table public.saved_domains (
  account_id text not null references public.billing_accounts (id) on delete cascade,
  domain text not null,
  topic text not null default '',
  status text not null default 'unchecked',
  created_at timestamptz not null default now(),
  primary key (account_id, domain)
);

-- Every generation (ideas, memes, bios, posts), for stats and history.
create table public.activity (
  id uuid primary key default gen_random_uuid(),
  account_id text not null references public.billing_accounts (id) on delete cascade,
  kind text not null check (kind in ('idea', 'meme', 'bios', 'content')),
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_account_idx on public.activity (account_id, kind, created_at desc);

create table public.bookmarks (
  account_id text not null references public.billing_accounts (id) on delete cascade,
  ref text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (account_id, ref)
);

create table public.generated_assets (
  id uuid primary key default gen_random_uuid(),
  account_id text not null references public.billing_accounts (id) on delete cascade,
  concept_id text not null,
  type text not null check (type in ('logo', 'mascot', 'meme', 'banner', 'site-hero')),
  pose text,
  mime text not null default 'image/webp',
  storage_path text not null unique,
  prompt text,
  model text,
  created_at timestamptz not null default now()
);
create index generated_assets_concept_idx on public.generated_assets (account_id, concept_id, created_at desc);

-- Outbound registrar clicks (affiliate conversion). No IPs or personal data.
create table public.domain_clicks (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  source text not null default 'other',
  account_id text,
  created_at timestamptz not null default now()
);
create index domain_clicks_created_idx on public.domain_clicks (created_at desc);

create trigger set_updated_at before update on public.projects for each row execute function public.set_updated_at();

-- RLS on, no policies: only the service role (which bypasses RLS) can touch these tables.
alter table public.projects enable row level security;
alter table public.saved_domains enable row level security;
alter table public.activity enable row level security;
alter table public.bookmarks enable row level security;
alter table public.generated_assets enable row level security;
alter table public.domain_clicks enable row level security;

-- Images are uploaded by the server only; anyone can read them (published sites show them).
drop policy if exists "generated: owner upload" on storage.objects;
drop policy if exists "generated: owner delete" on storage.objects;
insert into storage.buckets (id, name, public) values ('generated', 'generated', true) on conflict (id) do update set public = true;
