-- ============================================================
-- PRIVATE SOURCE DOCUMENT STORAGE
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'world-sources',
  'world-sources',
  false,
  26214400,
  array[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- ============================================================
-- SOURCE DOCUMENTS
-- ============================================================

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),

  world_id uuid not null
    references public.worlds(id)
    on delete cascade,

  uploaded_by uuid not null
    references auth.users(id)
    on delete cascade,

  source_type text not null
    default 'manuscript'
    check (
      source_type in (
        'manuscript',
        'world_bible',
        'reference_notes',
        'other'
      )
    ),

  import_mode text not null
    default 'analyze_only'
    check (
      import_mode in (
        'analyze_only',
        'import_only',
        'import_and_analyze'
      )
    ),

  title text not null,

  original_filename text not null,

  storage_path text not null unique,

  mime_type text not null,

  size_bytes bigint not null
    check (
      size_bytes >= 0
      and size_bytes <= 26214400
    ),

  checksum text,

  status text not null
    default 'uploaded'
    check (
      status in (
        'uploading',
        'uploaded',
        'parsing',
        'ready',
        'failed',
        'archived'
      )
    ),

  parser_version text,

  word_count integer
    check (
      word_count is null
      or word_count >= 0
    ),

  section_count integer
    check (
      section_count is null
      or section_count >= 0
    ),

  error_message text,

  processed_at timestamptz,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint source_documents_title_not_blank
    check (
      length(trim(title)) > 0
    ),

  constraint source_documents_filename_not_blank
    check (
      length(trim(original_filename)) > 0
    ),

  constraint source_documents_storage_path_not_blank
    check (
      length(trim(storage_path)) > 0
    )
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists source_documents_world_id_idx
  on public.source_documents(world_id);

create index if not exists source_documents_uploaded_by_idx
  on public.source_documents(uploaded_by);

create index if not exists source_documents_world_status_idx
  on public.source_documents(
    world_id,
    status
  );

create index if not exists source_documents_world_type_idx
  on public.source_documents(
    world_id,
    source_type
  );

create index if not exists source_documents_created_at_idx
  on public.source_documents(
    world_id,
    created_at desc
  );

create unique index if not exists source_documents_world_checksum_idx
  on public.source_documents(
    world_id,
    checksum
  )
  where checksum is not null;


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function
  public.update_source_document_timestamp()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
  source_documents_set_updated_at
on public.source_documents;

create trigger source_documents_set_updated_at
before update
on public.source_documents
for each row
execute function
  public.update_source_document_timestamp();


-- ============================================================
-- SOURCE DOCUMENT ROW LEVEL SECURITY
-- ============================================================

alter table public.source_documents
  enable row level security;


drop policy if exists
  "World owners can view source documents"
on public.source_documents;

create policy
  "World owners can view source documents"
on public.source_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id =
      source_documents.world_id
      and worlds.owner_id = auth.uid()
  )
);


drop policy if exists
  "World owners can create source documents"
on public.source_documents;

create policy
  "World owners can create source documents"
on public.source_documents
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.worlds
    where worlds.id =
      source_documents.world_id
      and worlds.owner_id = auth.uid()
  )
);


drop policy if exists
  "World owners can update source documents"
on public.source_documents;

create policy
  "World owners can update source documents"
on public.source_documents
for update
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id =
      source_documents.world_id
      and worlds.owner_id = auth.uid()
  )
)
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.worlds
    where worlds.id =
      source_documents.world_id
      and worlds.owner_id = auth.uid()
  )
);


drop policy if exists
  "World owners can delete source documents"
on public.source_documents;

create policy
  "World owners can delete source documents"
on public.source_documents
for delete
to authenticated
using (
  exists (
    select 1
    from public.worlds
    where worlds.id =
      source_documents.world_id
      and worlds.owner_id = auth.uid()
  )
);


-- ============================================================
-- PRIVATE STORAGE POLICIES
-- The first directory in every path must equal the user's ID.
-- ============================================================

drop policy if exists
  "Users can upload their source documents"
on storage.objects;

create policy
  "Users can upload their source documents"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'world-sources'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);


drop policy if exists
  "Users can read their source documents"
on storage.objects;

create policy
  "Users can read their source documents"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'world-sources'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);


drop policy if exists
  "Users can update their source documents"
on storage.objects;

create policy
  "Users can update their source documents"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'world-sources'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
)
with check (
  bucket_id = 'world-sources'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);


drop policy if exists
  "Users can delete their source documents"
on storage.objects;

create policy
  "Users can delete their source documents"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'world-sources'
  and (
    storage.foldername(name)
  )[1] = auth.uid()::text
);