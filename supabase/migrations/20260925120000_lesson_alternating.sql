-- Lessons that alternate week by week (e.g. Geography on odd weeks, Economics on even weeks)
-- keep the second subject and its teacher alongside the first.
alter table public.lessons
  add column alt_subject_id bigint references public.subjects (id) on delete restrict,
  add column alt_teacher text check (char_length(alt_teacher) <= 80);
create index lessons_alt_subject_idx on public.lessons (alt_subject_id);
