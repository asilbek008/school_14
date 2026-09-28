-- Covering indexes for the four foreign keys that did not have one (Supabase performance advisor,
-- lint 0001_unindexed_foreign_keys). Without them Postgres seq-scans the child table every time a
-- parent row is deleted: removing an admin walks private.admin_tg_links, deleting a class walks
-- private.cabinets, and deleting a document walks public.openness_items. The tables are small today,
-- so this is about the delete path staying cheap as they grow, not about the current row counts.
--
-- Not fixed here: the advisor also reports auth_rls_initplan on "record admin logins". That policy
-- already wraps every auth call -- (select auth.uid()), (select auth.jwt() ->> 'email') -- exactly as
-- the docs prescribe; the same shape on public.admins is not reported. The difference is that ours
-- sits in with check rather than using, which the linter does not look inside. Nothing to change.

create index if not exists admin_tg_links_user_idx on private.admin_tg_links (user_id);
create index if not exists cabinets_class_idx on private.cabinets (class_id);
create index if not exists staff_invites_invited_by_idx on private.staff_invites (invited_by);
create index if not exists openness_items_document_idx on public.openness_items (document_id);
