-- The library held one kind of book: the textbook a pupil needs for a lesson. A reading room is a different
-- thing -- the literature a pupil is meant to read for that year -- and mixing the two makes both harder to
-- find. One column separates them; everything already in the table is a textbook.
alter table public.textbooks
  add column section text not null default 'darslik' check (section in ('darslik', 'mutolaa'));

create index textbooks_section_idx on public.textbooks (section, grade, sort_order);
