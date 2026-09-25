-- A third league stage: the rounds played at our school, typed in by the admin (the league's Excel only has the
-- republic and region tables, and comes out later).
alter table public.league_tables drop constraint league_tables_stage_check;
alter table public.league_tables add constraint league_tables_stage_check check (stage in ('school', 'republic', 'region'));
