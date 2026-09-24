-- "Hujjatlar": the school's open documents — a licence, a charter, an order, a report, or a form a
-- parent fills in. Each is either a file in the media bucket or a link to another site (lex.uz and
-- the like). Only what the school itself publishes goes here; nothing about a pupil.

create table public.documents (
  id bigint generated always as identity primary key,
  title_uz text not null,
  title_ru text,
  title_en text,
  description_uz text,
  description_ru text,
  description_en text,
  category text not null default 'boshqa' check (category in ('meyoriy', 'buyruq', 'hisobot', 'shakl', 'boshqa')),
  -- A file uploaded to the media bucket, or a link to a document held elsewhere.
  kind text not null default 'file' check (kind in ('file', 'link')),
  path text,
  url text,
  -- Shown next to the title so a parent knows what they are about to open.
  file_type text check (file_type is null or char_length(file_type) <= 10),
  file_size bigint check (file_size is null or file_size >= 0),
  doc_date date,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_source check ((kind = 'file' and path is not null) or (kind = 'link' and url is not null))
);

create trigger documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

alter table public.documents enable row level security;
create policy "read published documents" on public.documents
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert documents" on public.documents
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update documents" on public.documents
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete documents" on public.documents
  for delete to authenticated using ((select private.is_admin()));

-- Document files live in the same media bucket, so it has to accept PDF, Word and Excel too.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
where id = 'media';
