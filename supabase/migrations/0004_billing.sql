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
