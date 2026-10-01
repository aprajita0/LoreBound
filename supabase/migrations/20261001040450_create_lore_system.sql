create table public.lore_entries (
  id uuid primary key default gen_random_uuid(),

  world_id uuid not null
    references public.worlds(id)
    on delete cascade,

  parent_entry_id uuid
    references public.lore_entries(id)
    on delete set null,

  title text not null,

  category text not null default 'other'
    check (
      category in (
        'magic',
        'culture',
        'religion',
        'faction',
        'species',
        'bloodline',
        'artifact',
        'language',
        'tradition',
        'law',
        'history',
        'creature',
        'technology',
        'cosmology',
        'other'
      )
    ),

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'canonical',
        'retired'
      )
    ),

  summary text not null default '',

  content_json jsonb not null default
    '{
      "type": "doc",
      "content": [
        {
          "type": "paragraph"
        }
      ]
    }'::jsonb,

  plain_text text not null default '',

  image_path text,

  tags text[] not null default '{}',

  is_featured boolean not null default false,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (parent_entry_id is null or parent_entry_id <> id)
);


create table public.lore_entry_characters (
  lore_entry_id uuid not null
    references public.lore_entries(id)
    on delete cascade,

  character_id uuid not null
    references public.characters(id)
    on delete cascade,

  relationship text not null default 'related',

  created_at timestamptz not null default now(),

  primary key (
    lore_entry_id,
    character_id
  )
);


create table public.lore_entry_places (
  lore_entry_id uuid not null
    references public.lore_entries(id)
    on delete cascade,

  place_id uuid not null
    references public.places(id)
    on delete cascade,

  relationship text not null default 'related',

  created_at timestamptz not null default now(),

  primary key (
    lore_entry_id,
    place_id
  )
);


create table public.lore_entry_links (
  source_entry_id uuid not null
    references public.lore_entries(id)
    on delete cascade,

  target_entry_id uuid not null
    references public.lore_entries(id)
    on delete cascade,

  relationship text not null default 'related',

  created_at timestamptz not null default now(),

  primary key (
    source_entry_id,
    target_entry_id
  ),

  check (source_entry_id <> target_entry_id)
);


create index lore_entries_world_id_idx
  on public.lore_entries(world_id);

create index lore_entries_parent_entry_id_idx
  on public.lore_entries(parent_entry_id);

create index lore_entries_category_idx
  on public.lore_entries(world_id, category);

create index lore_entries_status_idx
  on public.lore_entries(world_id, status);

create index lore_entries_featured_idx
  on public.lore_entries(world_id, is_featured);

create index lore_entry_characters_character_idx
  on public.lore_entry_characters(character_id);

create index lore_entry_places_place_idx
  on public.lore_entry_places(place_id);

create index lore_entry_links_target_idx
  on public.lore_entry_links(target_entry_id);


alter table public.lore_entries
  enable row level security;

alter table public.lore_entry_characters
  enable row level security;

alter table public.lore_entry_places
  enable row level security;

alter table public.lore_entry_links
  enable row level security;


create policy "Users can view lore in their worlds"
on public.lore_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = lore_entries.world_id
      and worlds.owner_id = auth.uid()
  )
);


create policy "Users can create lore in their worlds"
on public.lore_entries
for insert
to authenticated
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = lore_entries.world_id
      and worlds.owner_id = auth.uid()
  )
);


create policy "Users can update lore in their worlds"
on public.lore_entries
for update
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = lore_entries.world_id
      and worlds.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = lore_entries.world_id
      and worlds.owner_id = auth.uid()
  )
);


create policy "Users can delete lore in their worlds"
on public.lore_entries
for delete
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = lore_entries.world_id
      and worlds.owner_id = auth.uid()
  )
);


create policy "Users can manage lore character links"
on public.lore_entry_characters
for all
to authenticated
using (
  exists (
    select 1
    from public.lore_entries
    join public.worlds
      on worlds.id = lore_entries.world_id
    where lore_entries.id =
      lore_entry_characters.lore_entry_id
      and worlds.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.lore_entries
    join public.worlds
      on worlds.id = lore_entries.world_id
    where lore_entries.id =
      lore_entry_characters.lore_entry_id
      and worlds.owner_id = auth.uid()
  )
);


create policy "Users can manage lore place links"
on public.lore_entry_places
for all
to authenticated
using (
  exists (
    select 1
    from public.lore_entries
    join public.worlds
      on worlds.id = lore_entries.world_id
    where lore_entries.id =
      lore_entry_places.lore_entry_id
      and worlds.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.lore_entries
    join public.worlds
      on worlds.id = lore_entries.world_id
    where lore_entries.id =
      lore_entry_places.lore_entry_id
      and worlds.owner_id = auth.uid()
  )
);


create policy "Users can manage related lore links"
on public.lore_entry_links
for all
to authenticated
using (
  exists (
    select 1
    from public.lore_entries
    join public.worlds
      on worlds.id = lore_entries.world_id
    where lore_entries.id =
      lore_entry_links.source_entry_id
      and worlds.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.lore_entries
    join public.worlds
      on worlds.id = lore_entries.world_id
    where lore_entries.id =
      lore_entry_links.source_entry_id
      and worlds.owner_id = auth.uid()
  )
);


grant select, insert, update, delete
on public.lore_entries
to authenticated;

grant select, insert, update, delete
on public.lore_entry_characters
to authenticated;

grant select, insert, update, delete
on public.lore_entry_places
to authenticated;

grant select, insert, update, delete
on public.lore_entry_links
to authenticated;


insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'lore-images',
  'lore-images',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


create policy "Anyone can view lore images"
on storage.objects
for select
using (
  bucket_id = 'lore-images'
);


create policy "Users can upload lore images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'lore-images'
  and (storage.foldername(name))[1] =
    auth.uid()::text
);


create policy "Users can update their lore images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'lore-images'
  and (storage.foldername(name))[1] =
    auth.uid()::text
)
with check (
  bucket_id = 'lore-images'
  and (storage.foldername(name))[1] =
    auth.uid()::text
);


create policy "Users can delete their lore images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'lore-images'
  and (storage.foldername(name))[1] =
    auth.uid()::text
);