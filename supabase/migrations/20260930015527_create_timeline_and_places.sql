create table public.places (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  parent_place_id uuid references public.places(id) on delete set null,

  name text not null,
  place_type text not null default 'other',
  status text not null default 'active',

  summary text not null default '',
  description text not null default '',
  aliases text[] not null default '{}',
  image_path text,

  map_x double precision,
  map_y double precision,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint places_type_check check (
    place_type in (
      'world',
      'continent',
      'kingdom',
      'region',
      'city',
      'village',
      'building',
      'landmark',
      'wilderness',
      'other'
    )
  ),

  constraint places_status_check check (
    status in (
      'active',
      'hidden',
      'abandoned',
      'destroyed',
      'unknown'
    )
  ),

  constraint places_map_x_check check (
    map_x is null or (map_x >= 0 and map_x <= 100)
  ),

  constraint places_map_y_check check (
    map_y is null or (map_y >= 0 and map_y <= 100)
  )
);

create unique index places_world_name_unique
on public.places (world_id, lower(name));

create index places_world_id_index
on public.places (world_id);

create index places_parent_place_id_index
on public.places (parent_place_id);


create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  chapter_id uuid references public.chapters(id) on delete set null,

  title text not null,
  fictional_date text not null default '',
  era text not null default '',
  event_type text not null default 'other',
  status text not null default 'canonical',

  summary text not null default '',
  description text not null default '',

  importance smallint not null default 3,
  sort_order numeric not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint timeline_events_type_check check (
    event_type in (
      'birth',
      'death',
      'battle',
      'political',
      'relationship',
      'discovery',
      'journey',
      'prophecy',
      'historical',
      'personal',
      'other'
    )
  ),

  constraint timeline_events_status_check check (
    status in (
      'canonical',
      'disputed',
      'secret',
      'draft'
    )
  ),

  constraint timeline_events_importance_check check (
    importance between 1 and 5
  )
);

create index timeline_events_world_id_index
on public.timeline_events (world_id);

create index timeline_events_place_id_index
on public.timeline_events (place_id);

create index timeline_events_chapter_id_index
on public.timeline_events (chapter_id);

create index timeline_events_sort_order_index
on public.timeline_events (world_id, sort_order);


create table public.timeline_event_characters (
  event_id uuid not null
    references public.timeline_events(id)
    on delete cascade,

  character_id uuid not null
    references public.characters(id)
    on delete cascade,

  role_in_event text not null default '',

  primary key (event_id, character_id)
);

create index timeline_event_characters_character_index
on public.timeline_event_characters (character_id);


alter table public.places enable row level security;
alter table public.timeline_events enable row level security;
alter table public.timeline_event_characters enable row level security;


create policy "Users can view their world places"
on public.places
for select
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = places.world_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "Users can create places in their worlds"
on public.places
for insert
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = places.world_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "Users can update their world places"
on public.places
for update
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = places.world_id
      and worlds.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = places.world_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "Users can delete their world places"
on public.places
for delete
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = places.world_id
      and worlds.owner_id = auth.uid()
  )
);


create policy "Users can view their timeline events"
on public.timeline_events
for select
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = timeline_events.world_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "Users can create timeline events"
on public.timeline_events
for insert
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = timeline_events.world_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "Users can update their timeline events"
on public.timeline_events
for update
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = timeline_events.world_id
      and worlds.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = timeline_events.world_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "Users can delete their timeline events"
on public.timeline_events
for delete
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = timeline_events.world_id
      and worlds.owner_id = auth.uid()
  )
);


create policy "Users can view timeline event characters"
on public.timeline_event_characters
for select
using (
  exists (
    select 1
    from public.timeline_events
    join public.worlds
      on worlds.id = timeline_events.world_id
    where timeline_events.id =
      timeline_event_characters.event_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "Users can add timeline event characters"
on public.timeline_event_characters
for insert
with check (
  exists (
    select 1
    from public.timeline_events
    join public.worlds
      on worlds.id = timeline_events.world_id
    where timeline_events.id =
      timeline_event_characters.event_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "Users can update timeline event characters"
on public.timeline_event_characters
for update
using (
  exists (
    select 1
    from public.timeline_events
    join public.worlds
      on worlds.id = timeline_events.world_id
    where timeline_events.id =
      timeline_event_characters.event_id
      and worlds.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.timeline_events
    join public.worlds
      on worlds.id = timeline_events.world_id
    where timeline_events.id =
      timeline_event_characters.event_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "Users can remove timeline event characters"
on public.timeline_event_characters
for delete
using (
  exists (
    select 1
    from public.timeline_events
    join public.worlds
      on worlds.id = timeline_events.world_id
    where timeline_events.id =
      timeline_event_characters.event_id
      and worlds.owner_id = auth.uid()
  )
);