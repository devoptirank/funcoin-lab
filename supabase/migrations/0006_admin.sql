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
