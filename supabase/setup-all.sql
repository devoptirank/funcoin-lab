-- ===== supabase/migrations/0001_init.sql
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

-- ===== supabase/migrations/0002_generated_assets.sql
-- AI-generated images (logos, mascot poses, memes, banners, hero art).

create table if not exists public.generated_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  concept_id text not null,
  type text not null check (type in ('logo', 'mascot', 'meme', 'banner', 'site-hero')),
  pose text,
  mime text not null default 'image/webp',
  storage_path text not null unique,
  prompt text,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists generated_assets_concept_idx on public.generated_assets (user_id, concept_id, created_at desc);

alter table public.generated_assets enable row level security;
create policy "generated_assets: owner all" on public.generated_assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public-read bucket so published sites can display images. Writes are limited to the owner's folder.
insert into storage.buckets (id, name, public)
values ('generated', 'generated', true)
on conflict (id) do nothing;

create policy "generated: owner upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'generated' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "generated: owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'generated' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "generated: public read" on storage.objects
  for select using (bucket_id = 'generated');

-- ===== supabase/migrations/0003_domain_clicks.sql
-- Outbound registrar clicks, for measuring affiliate conversion. No IPs or personal data beyond user_id.

create table if not exists public.domain_clicks (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  source text not null default 'other',
  user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists domain_clicks_created_idx on public.domain_clicks (created_at desc);
create index if not exists domain_clicks_domain_idx on public.domain_clicks (domain);

alter table public.domain_clicks enable row level security;

-- Anyone may record a click (as themselves or anonymously). Nobody can read clicks through the API;
-- read them with the service role (dashboard / SQL editor).
create policy "domain_clicks: insert" on public.domain_clicks
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- ===== supabase/migrations/0004_billing.sql
-- Credits & crypto payments. Written ONLY by the server with the service role; no client policies.
-- Account ids look like "sol:<wallet address>".

create table if not exists public.billing_accounts (
  id text primary key,
  wallet text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  account_id text not null references public.billing_accounts (id) on delete cascade,
  delta integer not null,
  reason text not null,
  ref text not null unique,          -- idempotency: one grant/spend per ref
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_account_idx on public.credit_ledger (account_id, created_at desc);

create table if not exists public.payment_orders (
  id text primary key,
  account_id text not null references public.billing_accounts (id) on delete cascade,
  pack_id text not null,
  credits integer not null check (credits > 0),
  usd numeric(10, 2) not null,
  method text not null check (method in ('sol', 'usdc', 'nowpayments')),
  amount text not null,
  currency text not null,
  recipient text,
  reference text unique,
  signature text unique,             -- an on-chain transaction can pay for one order only
  provider_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'failed', 'partial')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  paid_at timestamptz
);
create index if not exists payment_orders_account_idx on public.payment_orders (account_id, created_at desc);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  order_id text,
  status text,
  body jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.auth_nonces (
  nonce text primary key,
  expires_at timestamptz not null
);

alter table public.billing_accounts enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.payment_orders enable row level security;
alter table public.payment_events enable row level security;
alter table public.auth_nonces enable row level security;
-- (No policies: only the service role, which bypasses RLS, can read or write these tables.)

create or replace function public.billing_ensure_account(p_account text, p_wallet text, p_welcome integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into billing_accounts (id, wallet) values (p_account, p_wallet) on conflict (id) do nothing;
  if found and p_welcome > 0 then
    insert into credit_ledger (account_id, delta, reason, ref)
    values (p_account, p_welcome, 'Welcome credits', 'welcome:' || p_account)
    on conflict (ref) do nothing;
  end if;
end $$;

create or replace function public.billing_balance(p_account text)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(delta), 0)::integer from credit_ledger where account_id = p_account;
$$;

-- Atomic spend: lock the account row so two concurrent spends can't both pass the balance check.
create or replace function public.billing_spend(p_account text, p_amount integer, p_reason text, p_ref text)
returns table (ok boolean, balance integer) language plpgsql security definer set search_path = public as $$
declare bal integer;
begin
  perform 1 from billing_accounts where id = p_account for update;
  select coalesce(sum(delta), 0) into bal from credit_ledger where account_id = p_account;
  if bal < p_amount then
    return query select false, bal;
    return;
  end if;
  insert into credit_ledger (account_id, delta, reason, ref) values (p_account, -p_amount, p_reason, p_ref);
  return query select true, bal - p_amount;
end $$;

create or replace function public.billing_credit(p_account text, p_delta integer, p_reason text, p_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into credit_ledger (account_id, delta, reason, ref) values (p_account, p_delta, p_reason, p_ref)
  on conflict (ref) do nothing;
  return found;
end $$;

-- pending -> paid exactly once, and grant the credits in the same transaction.
create or replace function public.billing_fulfill_order(p_order text, p_signature text, p_provider_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare o payment_orders;
begin
  update payment_orders
     set status = 'paid', paid_at = now(),
         signature = coalesce(p_signature, signature),
         provider_id = coalesce(p_provider_id, provider_id)
   where id = p_order and status <> 'paid'
   returning * into o;
  if not found then return false; end if;
  insert into credit_ledger (account_id, delta, reason, ref)
  values (o.account_id, o.credits, 'Bought ' || o.credits || ' credits', 'order:' || o.id)
  on conflict (ref) do nothing;
  return true;
end $$;

revoke all on function public.billing_ensure_account, public.billing_balance, public.billing_spend, public.billing_credit, public.billing_fulfill_order from public, anon, authenticated;

-- ===== supabase/migrations/0005_wallet_accounts.sql
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

-- ===== supabase/migrations/0006_admin.sql
-- Admin panel: admins, an append-only audit log, account status, moderation, runtime settings and
-- content reports. Every admin mutation is a security definer function that changes data AND writes
-- its audit row in the same transaction. Only the server (service role) can call them.
--
-- The p_actor argument is a JSON object built by the server after it has verified the admin:
--   { "account": "sol:...", "role": "owner|admin|support|viewer", "ip": "...", "ua": "...", "signature": "..." }

-- ---------- Tables ----------

create table if not exists public.admin_users (
  account_id text primary key,
  role text not null check (role in ('owner', 'admin', 'support', 'viewer')),
  added_by text,
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_account text not null,
  role text not null,
  action text not null,
  target_type text,
  target_id text,
  params jsonb not null default '{}'::jsonb,
  reason text not null,
  signature text,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_created_idx on public.admin_audit (created_at desc);
create index if not exists admin_audit_admin_idx on public.admin_audit (admin_account, created_at desc);
create index if not exists admin_audit_target_idx on public.admin_audit (target_type, target_id, created_at desc);
create index if not exists admin_audit_action_idx on public.admin_audit (action, created_at desc);

-- Append-only: block updates and deletes for everyone, including the service role.
create or replace function public.admin_audit_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'admin_audit is append-only';
end $$;
drop trigger if exists admin_audit_no_change on public.admin_audit;
create trigger admin_audit_no_change before update or delete on public.admin_audit
  for each row execute function public.admin_audit_immutable();
revoke update, delete, truncate on public.admin_audit from public, anon, authenticated, service_role;

alter table public.billing_accounts
  add column if not exists status text not null default 'active',
  add column if not exists status_reason text,
  add column if not exists status_changed_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists notes text;
do $$ begin
  alter table public.billing_accounts add constraint billing_accounts_status_check check (status in ('active', 'suspended', 'banned'));
exception when duplicate_object then null; end $$;

alter table public.projects
  add column if not exists moderation_status text not null default 'ok',
  add column if not exists moderation_reason text,
  add column if not exists featured boolean not null default false;
do $$ begin
  alter table public.projects add constraint projects_moderation_check check (moderation_status in ('ok', 'hidden', 'removed'));
exception when duplicate_object then null; end $$;

alter table public.generated_assets
  add column if not exists moderation_status text not null default 'ok',
  add column if not exists moderation_reason text;
do $$ begin
  alter table public.generated_assets add constraint generated_assets_moderation_check check (moderation_status in ('ok', 'hidden', 'removed'));
exception when duplicate_object then null; end $$;

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('site', 'asset')),
  target_id text not null,
  reason text not null,
  reporter_account text,
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_by text,
  resolved_at timestamptz
);

alter table public.admin_users enable row level security;
alter table public.admin_audit enable row level security;
alter table public.site_settings enable row level security;
alter table public.content_reports enable row level security;

-- ---------- Indexes for admin list views ----------

create index if not exists billing_accounts_created_idx on public.billing_accounts (created_at desc);
create index if not exists billing_accounts_status_idx on public.billing_accounts (status, created_at desc);
create index if not exists payment_orders_status_idx on public.payment_orders (status, created_at desc);
create index if not exists payment_orders_method_idx on public.payment_orders (method, created_at desc);
create index if not exists payment_orders_created_idx on public.payment_orders (created_at desc);
create index if not exists payment_events_order_idx on public.payment_events (order_id, created_at desc);
create index if not exists payment_events_created_idx on public.payment_events (created_at desc);
create index if not exists credit_ledger_created_idx on public.credit_ledger (created_at desc);
create index if not exists projects_published_updated_idx on public.projects (published, updated_at desc);
create index if not exists projects_moderation_idx on public.projects (moderation_status, updated_at desc);
create index if not exists projects_featured_idx on public.projects (featured) where featured;
create index if not exists generated_assets_created_idx on public.generated_assets (created_at desc);
create index if not exists generated_assets_type_idx on public.generated_assets (type, created_at desc);
create index if not exists activity_created_idx on public.activity (created_at desc);
create index if not exists bookmarks_ref_idx on public.bookmarks (ref, created_at desc);
create index if not exists domain_clicks_domain_created_idx on public.domain_clicks (domain, created_at desc);
create index if not exists content_reports_status_idx on public.content_reports (status, created_at desc);
create index if not exists content_reports_target_idx on public.content_reports (target_type, target_id);

-- ---------- Audit helper ----------

create or replace function public.admin_write_audit(p_actor jsonb, p_action text, p_target_type text, p_target_id text, p_params jsonb, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(p_reason), '') = '' then raise exception 'A reason is required'; end if;
  insert into admin_audit (admin_account, role, action, target_type, target_id, params, reason, signature, ip, user_agent)
  values (p_actor->>'account', p_actor->>'role', p_action, p_target_type, p_target_id, coalesce(p_params, '{}'::jsonb), p_reason,
          p_actor->>'signature', p_actor->>'ip', p_actor->>'ua');
end $$;

-- ---------- Mutations (each writes exactly one audit row) ----------

-- Grant (+) or deduct (-) credits. Idempotent by ref; a balance can never go below zero.
create or replace function public.admin_adjust_credits(p_actor jsonb, p_account text, p_delta integer, p_reason text, p_ref text)
returns table (ok boolean, balance integer) language plpgsql security definer set search_path = public as $$
declare bal integer;
begin
  if p_delta = 0 then raise exception 'Delta must not be zero'; end if;
  perform 1 from billing_accounts where id = p_account for update;
  if not found then raise exception 'Unknown account %', p_account; end if;
  if exists (select 1 from credit_ledger where ref = p_ref) then
    select coalesce(sum(delta), 0) into bal from credit_ledger where account_id = p_account;
    return query select false, bal;
    return;
  end if;
  select coalesce(sum(delta), 0) into bal from credit_ledger where account_id = p_account;
  if bal + p_delta < 0 then raise exception 'Balance would go below zero (balance %, change %)', bal, p_delta; end if;
  insert into credit_ledger (account_id, delta, reason, ref) values (p_account, p_delta, 'Admin: ' || p_reason, p_ref);
  perform admin_write_audit(p_actor, case when p_delta > 0 then 'credits.grant' else 'credits.deduct' end, 'account', p_account,
                            jsonb_build_object('delta', p_delta, 'ref', p_ref, 'balance_before', bal), p_reason);
  return query select true, bal + p_delta;
end $$;

create or replace function public.admin_set_account_status(p_actor jsonb, p_account text, p_status text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare prev text;
begin
  select status into prev from billing_accounts where id = p_account for update;
  if not found then raise exception 'Unknown account %', p_account; end if;
  update billing_accounts set status = p_status, status_reason = p_reason, status_changed_at = now() where id = p_account;
  perform admin_write_audit(p_actor, 'account.status', 'account', p_account, jsonb_build_object('from', prev, 'to', p_status), p_reason);
end $$;

create or replace function public.admin_set_account_notes(p_actor jsonb, p_account text, p_notes text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update billing_accounts set notes = p_notes where id = p_account;
  if not found then raise exception 'Unknown account %', p_account; end if;
  perform admin_write_audit(p_actor, 'account.notes', 'account', p_account, jsonb_build_object('length', length(coalesce(p_notes, ''))), p_reason);
end $$;

create or replace function public.admin_moderate_project(p_actor jsonb, p_project text, p_status text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare prev text;
begin
  select moderation_status into prev from projects where id = p_project for update;
  if not found then raise exception 'Unknown project %', p_project; end if;
  update projects set moderation_status = p_status, moderation_reason = p_reason,
         featured = case when p_status = 'ok' then featured else false end
   where id = p_project;
  perform admin_write_audit(p_actor, 'project.moderate', 'project', p_project, jsonb_build_object('from', prev, 'to', p_status), p_reason);
end $$;

create or replace function public.admin_unpublish_project(p_actor jsonb, p_project text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update projects set published = false, published_at = null, featured = false where id = p_project;
  if not found then raise exception 'Unknown project %', p_project; end if;
  perform admin_write_audit(p_actor, 'project.unpublish', 'project', p_project, '{}'::jsonb, p_reason);
end $$;

create or replace function public.admin_set_featured(p_actor jsonb, p_project text, p_featured boolean, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update projects set featured = p_featured where id = p_project and (not p_featured or (published and moderation_status = 'ok'));
  if not found then raise exception 'Project % is not published and visible', p_project; end if;
  perform admin_write_audit(p_actor, case when p_featured then 'project.feature' else 'project.unfeature' end, 'project', p_project, '{}'::jsonb, p_reason);
end $$;

create or replace function public.admin_moderate_asset(p_actor jsonb, p_asset uuid, p_status text, p_reason text)
returns text language plpgsql security definer set search_path = public as $$
declare path text;
begin
  update generated_assets set moderation_status = p_status, moderation_reason = p_reason where id = p_asset returning storage_path into path;
  if not found then raise exception 'Unknown asset %', p_asset; end if;
  perform admin_write_audit(p_actor, 'asset.moderate', 'asset', p_asset::text, jsonb_build_object('to', p_status, 'path', path), p_reason);
  return path;
end $$;

create or replace function public.admin_resolve_report(p_actor jsonb, p_report uuid, p_status text, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update content_reports set status = p_status, resolved_by = p_actor->>'account', resolved_at = now() where id = p_report;
  if not found then raise exception 'Unknown report %', p_report; end if;
  perform admin_write_audit(p_actor, 'report.resolve', 'report', p_report::text, jsonb_build_object('to', p_status), p_reason);
end $$;

create or replace function public.admin_set_setting(p_actor jsonb, p_key text, p_value jsonb, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare prev jsonb;
begin
  select value into prev from site_settings where key = p_key;
  insert into site_settings (key, value, updated_by, updated_at) values (p_key, p_value, p_actor->>'account', now())
  on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();
  perform admin_write_audit(p_actor, 'setting.update', 'setting', p_key, jsonb_build_object('from', prev, 'to', p_value), p_reason);
end $$;

-- Owners only. Env owners (ADMIN_WALLETS) are passed in as p_protected and can never be changed here.
create or replace function public.admin_upsert_admin(p_actor jsonb, p_account text, p_role text, p_reason text, p_protected text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_actor->>'role' <> 'owner' then raise exception 'Only owners can manage admins'; end if;
  if p_account = any(p_protected) then raise exception 'Env owners are managed with ADMIN_WALLETS'; end if;
  insert into admin_users (account_id, role, added_by) values (p_account, p_role, p_actor->>'account')
  on conflict (account_id) do update set role = excluded.role, disabled_at = null;
  perform admin_write_audit(p_actor, 'admin.upsert', 'admin', p_account, jsonb_build_object('role', p_role), p_reason);
end $$;

create or replace function public.admin_disable_admin(p_actor jsonb, p_account text, p_reason text, p_protected text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_actor->>'role' <> 'owner' then raise exception 'Only owners can manage admins'; end if;
  if p_account = any(p_protected) then raise exception 'Env owners are managed with ADMIN_WALLETS'; end if;
  update admin_users set disabled_at = now() where account_id = p_account and disabled_at is null;
  if not found then raise exception 'Unknown or already disabled admin %', p_account; end if;
  perform admin_write_audit(p_actor, 'admin.disable', 'admin', p_account, '{}'::jsonb, p_reason);
end $$;

revoke all on function
  public.admin_write_audit(jsonb, text, text, text, jsonb, text),
  public.admin_adjust_credits(jsonb, text, integer, text, text),
  public.admin_set_account_status(jsonb, text, text, text),
  public.admin_set_account_notes(jsonb, text, text, text),
  public.admin_moderate_project(jsonb, text, text, text),
  public.admin_unpublish_project(jsonb, text, text),
  public.admin_set_featured(jsonb, text, boolean, text),
  public.admin_moderate_asset(jsonb, uuid, text, text),
  public.admin_resolve_report(jsonb, uuid, text, text),
  public.admin_set_setting(jsonb, text, jsonb, text),
  public.admin_upsert_admin(jsonb, text, text, text, text[]),
  public.admin_disable_admin(jsonb, text, text, text[])
from public, anon, authenticated;

-- The server calls these with the service role.
grant execute on function
  public.admin_adjust_credits(jsonb, text, integer, text, text),
  public.admin_set_account_status(jsonb, text, text, text),
  public.admin_set_account_notes(jsonb, text, text, text),
  public.admin_moderate_project(jsonb, text, text, text),
  public.admin_unpublish_project(jsonb, text, text),
  public.admin_set_featured(jsonb, text, boolean, text),
  public.admin_moderate_asset(jsonb, uuid, text, text),
  public.admin_resolve_report(jsonb, uuid, text, text),
  public.admin_set_setting(jsonb, text, jsonb, text),
  public.admin_upsert_admin(jsonb, text, text, text, text[]),
  public.admin_disable_admin(jsonb, text, text, text[])
to service_role;

