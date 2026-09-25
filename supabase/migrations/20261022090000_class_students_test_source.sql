-- Pupils per class, entered by the admin (the site's school total is their sum once every class has one),
-- and where a test's questions come from (author or source and its licence), shown under the test.

alter table public.school_classes add column students smallint check (students between 0 and 60);
alter table public.tests add column source text check (char_length(source) <= 300);
