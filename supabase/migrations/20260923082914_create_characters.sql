create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  role text not null default '',
  summary text not null default '',
  importance text not null default 'supporting'
    check (importance in ('major', 'supporting', 'minor')),
  status text not null default 'active'
    check (status in ('active', 'absent', 'deceased', 'unknown')),
  location text not null default '',
  portrait_path text,
  aliases text[] not null default '{}',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists characters_world_id_idx
  on public.characters(world_id);

create index if not exists characters_world_name_idx
  on public.characters(world_id, name);

create or replace function public.set_characters_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists characters_set_updated_at on public.characters;
create trigger characters_set_updated_at
before update on public.characters
for each row execute function public.set_characters_updated_at();

alter table public.characters enable row level security;

drop policy if exists "World owners can read characters" on public.characters;
create policy "World owners can read characters"
on public.characters
for select
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = characters.world_id
      and worlds.owner_id = (select auth.uid())
  )
);

drop policy if exists "World owners can create characters" on public.characters;
create policy "World owners can create characters"
on public.characters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = characters.world_id
      and worlds.owner_id = (select auth.uid())
  )
);

drop policy if exists "World owners can update characters" on public.characters;
create policy "World owners can update characters"
on public.characters
for update
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = characters.world_id
      and worlds.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = characters.world_id
      and worlds.owner_id = (select auth.uid())
  )
);

drop policy if exists "World owners can delete characters" on public.characters;
create policy "World owners can delete characters"
on public.characters
for delete
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = characters.world_id
      and worlds.owner_id = (select auth.uid())
  )
);

grant select, insert, update, delete on public.characters to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'character-portraits',
  'character-portraits',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their character portraits" on storage.objects;
create policy "Users can read their character portraits"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'character-portraits'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can upload their character portraits" on storage.objects;
create policy "Users can upload their character portraits"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'character-portraits'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can replace their character portraits" on storage.objects;
create policy "Users can replace their character portraits"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'character-portraits'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'character-portraits'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can delete their character portraits" on storage.objects;
create policy "Users can delete their character portraits"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'character-portraits'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
