do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'characters_id_world_id_unique'
  ) then
    alter table public.characters
      add constraint characters_id_world_id_unique
      unique (id, world_id);
  end if;
end
$$;

create table if not exists public.character_relationships (
  id uuid primary key default gen_random_uuid(),

  world_id uuid not null
    references public.worlds(id)
    on delete cascade,

  source_character_id uuid not null,

  target_character_id uuid not null,

  category text not null default 'other'
    check (
      category in (
        'romantic',
        'family',
        'friendship',
        'alliance',
        'mentor',
        'rivalry',
        'enemy',
        'other'
      )
    ),

  source_label text not null default '',

  target_label text not null default '',

  description text not null default '',

  status text not null default 'active'
    check (
      status in (
        'active',
        'strained',
        'broken',
        'past',
        'unknown'
      )
    ),

  strength smallint not null default 3
    check (
      strength between 1 and 5
    ),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint relationship_characters_different
    check (
      source_character_id <> target_character_id
    ),

  constraint relationship_source_character_fk
    foreign key (
      source_character_id,
      world_id
    )
    references public.characters (
      id,
      world_id
    )
    on delete cascade,

  constraint relationship_target_character_fk
    foreign key (
      target_character_id,
      world_id
    )
    references public.characters (
      id,
      world_id
    )
    on delete cascade
);

create index if not exists
  character_relationships_world_id_idx
on public.character_relationships (
  world_id
);

create index if not exists
  character_relationships_source_idx
on public.character_relationships (
  source_character_id
);

create index if not exists
  character_relationships_target_idx
on public.character_relationships (
  target_character_id
);

create index if not exists
  character_relationships_category_idx
on public.character_relationships (
  world_id,
  category
);

create or replace function
  public.set_character_relationships_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
  character_relationships_set_updated_at
on public.character_relationships;

create trigger
  character_relationships_set_updated_at
before update
on public.character_relationships
for each row
execute function
  public.set_character_relationships_updated_at();

alter table
  public.character_relationships
enable row level security;

drop policy if exists
  "World owners can read character relationships"
on public.character_relationships;

create policy
  "World owners can read character relationships"
on public.character_relationships
for select
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where
      worlds.id =
        character_relationships.world_id
      and worlds.owner_id =
        (select auth.uid())
  )
);

drop policy if exists
  "World owners can create character relationships"
on public.character_relationships;

create policy
  "World owners can create character relationships"
on public.character_relationships
for insert
to authenticated
with check (
  exists (
    select 1
    from public.worlds
    where
      worlds.id =
        character_relationships.world_id
      and worlds.owner_id =
        (select auth.uid())
  )
);

drop policy if exists
  "World owners can update character relationships"
on public.character_relationships;

create policy
  "World owners can update character relationships"
on public.character_relationships
for update
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where
      worlds.id =
        character_relationships.world_id
      and worlds.owner_id =
        (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.worlds
    where
      worlds.id =
        character_relationships.world_id
      and worlds.owner_id =
        (select auth.uid())
  )
);

drop policy if exists
  "World owners can delete character relationships"
on public.character_relationships;

create policy
  "World owners can delete character relationships"
on public.character_relationships
for delete
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where
      worlds.id =
      
        character_relationships.world_id
      and worlds.owner_id =
        (select auth.uid())
  )
);

grant
  select,
  insert,
  update,
  delete
on public.character_relationships
to authenticated;