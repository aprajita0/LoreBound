-- Lorebound Milestone 1
-- Profiles, worlds, chapters, version history, ownership, and RLS.

create extension if not exists pgcrypto;

-- =========================================================
-- Utility functions
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- Profiles
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Create a profile automatically when a user signs up.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =========================================================
-- Worlds
-- =========================================================

create table public.worlds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  genre text,
  cover_path text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed', 'archived')),
  last_opened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint worlds_title_not_blank
    check (char_length(trim(title)) > 0)
);

create index worlds_owner_id_idx
on public.worlds(owner_id);

create index worlds_last_opened_at_idx
on public.worlds(last_opened_at desc);

create trigger worlds_set_updated_at
before update on public.worlds
for each row
execute function public.set_updated_at();

alter table public.worlds enable row level security;

create policy "Users can read their own worlds"
on public.worlds
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Users can create their own worlds"
on public.worlds
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Users can update their own worlds"
on public.worlds
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Users can delete their own worlds"
on public.worlds
for delete
to authenticated
using ((select auth.uid()) = owner_id);

-- =========================================================
-- Chapters
-- =========================================================

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  title text not null default 'Untitled Chapter',
  subtitle text,
  position integer not null default 0
    check (position >= 0),

  -- Tiptap/ProseMirror document JSON.
  content_json jsonb not null default
    '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,

  -- Searchable and analyzable plain-text version.
  plain_text text not null default '',

  word_count integer not null default 0
    check (word_count >= 0),

  status text not null default 'draft'
    check (status in ('draft', 'reviewed', 'final')),

  analysis_status text not null default 'not_analyzed'
    check (
      analysis_status in (
        'not_analyzed',
        'queued',
        'analyzing',
        'completed',
        'failed'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chapters_title_not_blank
    check (char_length(trim(title)) > 0)
);

create index chapters_world_id_idx
on public.chapters(world_id);

create index chapters_world_position_idx
on public.chapters(world_id, position);

create index chapters_updated_at_idx
on public.chapters(updated_at desc);

create trigger chapters_set_updated_at
before update on public.chapters
for each row
execute function public.set_updated_at();

alter table public.chapters enable row level security;

create policy "Users can read chapters in their worlds"
on public.chapters
for select
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = chapters.world_id
      and worlds.owner_id = (select auth.uid())
  )
);

create policy "Users can create chapters in their worlds"
on public.chapters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = chapters.world_id
      and worlds.owner_id = (select auth.uid())
  )
);

create policy "Users can update chapters in their worlds"
on public.chapters
for update
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = chapters.world_id
      and worlds.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = chapters.world_id
      and worlds.owner_id = (select auth.uid())
  )
);

create policy "Users can delete chapters in their worlds"
on public.chapters
for delete
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = chapters.world_id
      and worlds.owner_id = (select auth.uid())
  )
);

-- =========================================================
-- Chapter version history
-- =========================================================

create table public.chapter_versions (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  content_json jsonb not null,
  plain_text text not null default '',
  word_count integer not null default 0
    check (word_count >= 0),
  created_at timestamptz not null default now()
);

create index chapter_versions_chapter_id_idx
on public.chapter_versions(chapter_id);

create index chapter_versions_created_at_idx
on public.chapter_versions(chapter_id, created_at desc);

alter table public.chapter_versions enable row level security;

create policy "Users can read versions from their worlds"
on public.chapter_versions
for select
to authenticated
using (
  exists (
    select 1
    from public.chapters
    join public.worlds
      on worlds.id = chapters.world_id
    where chapters.id = chapter_versions.chapter_id
      and worlds.owner_id = (select auth.uid())
  )
);

create policy "Users can create versions in their worlds"
on public.chapter_versions
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.chapters
    join public.worlds
      on worlds.id = chapters.world_id
    where chapters.id = chapter_versions.chapter_id
      and worlds.owner_id = (select auth.uid())
  )
);

create policy "Users can delete versions from their worlds"
on public.chapter_versions
for delete
to authenticated
using (
  exists (
    select 1
    from public.chapters
    join public.worlds
      on worlds.id = chapters.world_id
    where chapters.id = chapter_versions.chapter_id
      and worlds.owner_id = (select auth.uid())
  )
);