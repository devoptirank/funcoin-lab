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
