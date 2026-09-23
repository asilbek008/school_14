-- Staff profiles (extra public details) and the weekly lesson timetable.
-- Same security shape as the other content tables: public reads published rows, admins write,
-- one policy per table and action.

-- Staff profile details. Phone/email are shown publicly, so admins fill them only with consent.
alter table public.staff
  add column category_uz text, -- qualification category, e.g. "Oliy toifa"
  add column category_ru text,
  add column category_en text,
  add column education_uz text,
  add column education_ru text,
  add column education_en text,
  add column experience_years smallint check (experience_years between 0 and 70),
  add column phone text,
  add column email text,
  add column bio_uz text,
  add column bio_ru text,
  add column bio_en text;

-- Subjects are entered once and picked from a list in the timetable editor.
create table public.subjects (
  id bigint generated always as identity primary key,
  name_uz text not null,
  name_ru text,
  name_en text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

-- A class is a grade plus a letter (5-"A"). The shift comes from the grade (src/lib/bells.ts).
create table public.school_classes (
  id bigint generated always as identity primary key,
  grade smallint not null check (grade between 1 and 11),
  letter text not null check (char_length(letter) between 1 and 8),
  homeroom_teacher_id bigint references public.staff (id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grade, letter)
);
create index school_classes_homeroom_idx on public.school_classes (homeroom_teacher_id);

-- One row per filled timetable cell. weekday 1 = Monday … 6 = Saturday; period matches the
-- bell schedule (6 lessons per shift). A subject in use cannot be deleted.
create table public.lessons (
  id bigint generated always as identity primary key,
  class_id bigint not null references public.school_classes (id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 6),
  period smallint not null check (period between 1 and 6),
  subject_id bigint not null references public.subjects (id) on delete restrict,
  unique (class_id, weekday, period)
);
create index lessons_subject_idx on public.lessons (subject_id);

create trigger school_classes_updated_at before update on public.school_classes
  for each row execute function public.set_updated_at();

alter table public.subjects enable row level security;
alter table public.school_classes enable row level security;
alter table public.lessons enable row level security;

create policy "read subjects" on public.subjects
  for select to anon, authenticated using (true);
create policy "admins insert subjects" on public.subjects
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update subjects" on public.subjects
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete subjects" on public.subjects
  for delete to authenticated using ((select private.is_admin()));

create policy "read published classes" on public.school_classes
  for select to anon, authenticated using (is_published or (select private.is_admin()));
create policy "admins insert classes" on public.school_classes
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update classes" on public.school_classes
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete classes" on public.school_classes
  for delete to authenticated using ((select private.is_admin()));

-- Lessons are visible when their class is (the class's own policy decides that).
create policy "read lessons of visible classes" on public.lessons
  for select to anon, authenticated using (
    exists (select 1 from public.school_classes c where c.id = class_id)
  );
create policy "admins insert lessons" on public.lessons
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update lessons" on public.lessons
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins delete lessons" on public.lessons
  for delete to authenticated using ((select private.is_admin()));
