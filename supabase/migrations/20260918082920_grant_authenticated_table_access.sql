-- Allow signed-in users to access the public schema.
grant usage on schema public to authenticated;

-- Profiles
grant select, insert, update, delete
on table public.profiles
to authenticated;

-- Worlds
grant select, insert, update, delete
on table public.worlds
to authenticated;

-- Chapters
grant select, insert, update, delete
on table public.chapters
to authenticated;

-- Chapter versions
grant select, insert, update, delete
on table public.chapter_versions
to authenticated;

-- Grant access automatically to future tables created by postgres.
alter default privileges for role postgres
in schema public
grant select, insert, update, delete on tables to authenticated;

-- Grant sequence access in case future tables use identity columns.
grant usage, select on all sequences in schema public to authenticated;

alter default privileges for role postgres
in schema public
grant usage, select on sequences to authenticated;