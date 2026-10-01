-- ============================================================
-- SECRETS
-- ============================================================

create table if not exists public.secrets (
  id uuid primary key default gen_random_uuid(),

  world_id uuid not null
    references public.worlds(id)
    on delete cascade,

  title text not null,

  category text not null default 'other'
    check (
      category in (
        'identity',
        'betrayal',
        'relationship',
        'crime',
        'political',
        'magical',
        'historical',
        'prophecy',
        'lineage',
        'other'
      )
    ),

  severity text not null default 'dangerous'
    check (
      severity in (
        'minor',
        'dangerous',
        'catastrophic'
      )
    ),

  status text not null default 'buried'
    check (
      status in (
        'buried',
        'active',
        'partially_revealed',
        'exposed'
      )
    ),

  -- What characters or the public currently believe.
  public_story text not null default '',

  -- The real secret, stored as a rich-text document.
  truth_json jsonb not null default
    '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,

  -- Plain-text version used for previews and future AI analysis.
  truth_plain_text text not null default '',

  reveal_condition text not null default '',
  consequences text not null default '',
  evidence text not null default '',

  image_path text,

  is_featured boolean not null default false,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint secrets_title_not_blank
    check (length(trim(title)) > 0)
);

create index if not exists secrets_world_id_idx
  on public.secrets(world_id);

create index if not exists secrets_world_status_idx
  on public.secrets(world_id, status);

create index if not exists secrets_world_category_idx
  on public.secrets(world_id, category);

create index if not exists secrets_featured_idx
  on public.secrets(world_id, is_featured desc, sort_order);


-- ============================================================
-- CHARACTER KNOWLEDGE
-- Tracks who knows, suspects, or remains unaware of each secret.
-- ============================================================

create table if not exists public.secret_character_knowledge (
  id uuid primary key default gen_random_uuid(),

  secret_id uuid not null
    references public.secrets(id)
    on delete cascade,

  character_id uuid not null
    references public.characters(id)
    on delete cascade,

  knowledge_state text not null default 'unaware'
    check (
      knowledge_state in (
        'knows',
        'suspects',
        'unaware'
      )
    ),

  knowledge_notes text not null default '',

  learned_in_chapter_id uuid
    references public.chapters(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(secret_id, character_id)
);

create index if not exists secret_knowledge_secret_idx
  on public.secret_character_knowledge(secret_id);

create index if not exists secret_knowledge_character_idx
  on public.secret_character_knowledge(character_id);

create index if not exists secret_knowledge_state_idx
  on public.secret_character_knowledge(secret_id, knowledge_state);


-- ============================================================
-- RELATED PLACES
-- ============================================================

create table if not exists public.secret_places (
  secret_id uuid not null
    references public.secrets(id)
    on delete cascade,

  place_id uuid not null
    references public.places(id)
    on delete cascade,

  relationship text not null default 'related',

  created_at timestamptz not null default now(),

  primary key(secret_id, place_id)
);

create index if not exists secret_places_place_idx
  on public.secret_places(place_id);


-- ============================================================
-- RELATED LORE
-- ============================================================

create table if not exists public.secret_lore_entries (
  secret_id uuid not null
    references public.secrets(id)
    on delete cascade,

  lore_entry_id uuid not null
    references public.lore_entries(id)
    on delete cascade,

  relationship text not null default 'related',

  created_at timestamptz not null default now(),

  primary key(secret_id, lore_entry_id)
);

create index if not exists secret_lore_entry_idx
  on public.secret_lore_entries(lore_entry_id);


-- ============================================================
-- RELATED CHAPTERS
-- ============================================================

create table if not exists public.secret_chapters (
  secret_id uuid not null
    references public.secrets(id)
    on delete cascade,

  chapter_id uuid not null
    references public.chapters(id)
    on delete cascade,

  relationship text not null default 'related',

  created_at timestamptz not null default now(),

  primary key(secret_id, chapter_id)
);

create index if not exists secret_chapters_chapter_idx
  on public.secret_chapters(chapter_id);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.secrets
  enable row level security;

alter table public.secret_character_knowledge
  enable row level security;

alter table public.secret_places
  enable row level security;

alter table public.secret_lore_entries
  enable row level security;

alter table public.secret_chapters
  enable row level security;


-- ============================================================
-- SECRETS POLICIES
-- ============================================================

create policy "World owners can view secrets"
on public.secrets
for select
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = secrets.world_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can create secrets"
on public.secrets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = secrets.world_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can update secrets"
on public.secrets
for update
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = secrets.world_id
      and worlds.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.worlds
    where worlds.id = secrets.world_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can delete secrets"
on public.secrets
for delete
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id = secrets.world_id
      and worlds.owner_id = auth.uid()
  )
);


-- ============================================================
-- CHARACTER KNOWLEDGE POLICIES
-- ============================================================

create policy "World owners can view secret knowledge"
on public.secret_character_knowledge
for select
to authenticated
using (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id =
      secret_character_knowledge.secret_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can create secret knowledge"
on public.secret_character_knowledge
for insert
to authenticated
with check (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id =
      secret_character_knowledge.secret_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can update secret knowledge"
on public.secret_character_knowledge
for update
to authenticated
using (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id =
      secret_character_knowledge.secret_id
      and worlds.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id =
      secret_character_knowledge.secret_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can delete secret knowledge"
on public.secret_character_knowledge
for delete
to authenticated
using (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id =
      secret_character_knowledge.secret_id
      and worlds.owner_id = auth.uid()
  )
);


-- ============================================================
-- RELATED PLACE POLICIES
-- ============================================================

create policy "World owners can view secret places"
on public.secret_places
for select
to authenticated
using (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id = secret_places.secret_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can create secret places"
on public.secret_places
for insert
to authenticated
with check (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id = secret_places.secret_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can delete secret places"
on public.secret_places
for delete
to authenticated
using (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id = secret_places.secret_id
      and worlds.owner_id = auth.uid()
  )
);


-- ============================================================
-- RELATED LORE POLICIES
-- ============================================================

create policy "World owners can view secret lore"
on public.secret_lore_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id =
      secret_lore_entries.secret_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can create secret lore"
on public.secret_lore_entries
for insert
to authenticated
with check (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id =
      secret_lore_entries.secret_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can delete secret lore"
on public.secret_lore_entries
for delete
to authenticated
using (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id =
      secret_lore_entries.secret_id
      and worlds.owner_id = auth.uid()
  )
);


-- ============================================================
-- RELATED CHAPTER POLICIES
-- ============================================================

create policy "World owners can view secret chapters"
on public.secret_chapters
for select
to authenticated
using (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id =
      secret_chapters.secret_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can create secret chapters"
on public.secret_chapters
for insert
to authenticated
with check (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id =
      secret_chapters.secret_id
      and worlds.owner_id = auth.uid()
  )
);

create policy "World owners can delete secret chapters"
on public.secret_chapters
for delete
to authenticated
using (
  exists (
    select 1
    from public.secrets
    join public.worlds
      on worlds.id = secrets.world_id
    where secrets.id =
      secret_chapters.secret_id
      and worlds.owner_id = auth.uid()
  )
);