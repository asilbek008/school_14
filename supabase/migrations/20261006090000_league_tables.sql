-- "O‘quvchilar ligasi" standings for a regular program (Zakovat): one row per stage (republic / region), the whole
-- table as JSON, replaced by each Excel import. rows: [{ place, team, school, points, rating, rounds: [[points, rating] | null] }].
create table public.league_tables (
  program_id bigint not null references public.programs (id) on delete cascade,
  stage text not null check (stage in ('republic', 'region')),
  title text,
  as_of date,
  rows jsonb not null default '[]'::jsonb check (jsonb_typeof(rows) = 'array'),
  updated_at timestamptz not null default now(),
  primary key (program_id, stage)
);

alter table public.league_tables enable row level security;

-- Visible when the program is (its read policy decides), like program_media.
create policy "read league tables of visible programs" on public.league_tables
  for select to anon, authenticated using (
    exists (select 1 from public.programs p where p.id = program_id)
  );
create policy "admins insert league tables" on public.league_tables
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update league tables" on public.league_tables
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete league tables" on public.league_tables
  for delete to authenticated using ((select private.is_admin()));
