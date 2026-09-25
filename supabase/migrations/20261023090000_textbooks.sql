-- "Elektron kutubxona": textbooks and other study books as PDF, by grade and subject, read right on the
-- site. Each book is a PDF in the media bucket (up to the bucket's 50 MB) or a link to one held
-- elsewhere (bigger files, the ministry's own site). Only books the school may share go here; the
-- source column says where each came from.

create table public.textbooks (
  id bigint generated always as identity primary key,
  title_uz text not null,
  title_ru text,
  title_en text,
  description_uz text,
  description_ru text,
  description_en text,
  -- Empty grade: for any grade (a dictionary, a reading book).
  grade smallint check (grade between 1 and 11),
  subject_id bigint references public.subjects (id) on delete set null,
  -- The language the book is written in (the school has Uzbek and Russian classes).
  language text not null default 'uz' check (language in ('uz', 'ru', 'en')),
  author text check (char_length(author) <= 300),
  -- Edition or year, as printed ("2023", "3-nashr").
  edition text check (char_length(edition) <= 60),
  source text check (char_length(source) <= 300),
  kind text not null default 'file' check (kind in ('file', 'link')),
  path text,
  url text,
  file_size bigint check (file_size is null or file_size >= 0),
  pages integer check (pages is null or pages > 0),
  cover text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint textbooks_source check ((kind = 'file' and path is not null) or (kind = 'link' and url is not null))
);

create trigger textbooks_updated_at before update on public.textbooks
  for each row execute function public.set_updated_at();

alter table public.textbooks enable row level security;
create policy "read published textbooks" on public.textbooks
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert textbooks" on public.textbooks
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update textbooks" on public.textbooks
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete textbooks" on public.textbooks
  for delete to authenticated using ((select private.is_admin()));

create index textbooks_grade_idx on public.textbooks (grade, sort_order);
create index textbooks_subject_idx on public.textbooks (subject_id);

create trigger textbooks_audit after insert or update or delete on public.textbooks
  for each row execute function private.log_change();
