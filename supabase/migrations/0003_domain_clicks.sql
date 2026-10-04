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
