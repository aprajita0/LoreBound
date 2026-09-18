alter table public.worlds
  add column if not exists point_of_view text,
  add column if not exists tense text,
  add column if not exists rules text[] not null default '{}';