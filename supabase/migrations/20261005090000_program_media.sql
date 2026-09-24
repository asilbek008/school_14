-- Photos and videos of a regular program: a file in media/programs/<id>/ ('photo' / 'video') or a
-- YouTube video id ('youtube'). Visible when the program is (its read policy decides), like club_media.
create table public.program_media (
  id bigint generated always as identity primary key,
  program_id bigint not null references public.programs (id) on delete cascade,
  kind text not null check (kind in ('photo', 'video', 'youtube')),
  path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index program_media_program_idx on public.program_media (program_id, sort_order, id);

alter table public.program_media enable row level security;

create policy "read media of visible programs" on public.program_media
  for select to anon, authenticated using (
    exists (select 1 from public.programs p where p.id = program_id)
  );
create policy "admins insert program media" on public.program_media
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update program media" on public.program_media
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete program media" on public.program_media
  for delete to authenticated using ((select private.is_admin()));
