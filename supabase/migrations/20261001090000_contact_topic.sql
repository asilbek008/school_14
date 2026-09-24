-- The contact form asks what the message is about (question, suggestion, request, other), so
-- the admin inbox can show it as a label. Older messages have none.
alter table public.contact_messages
  add column topic text check (topic is null or topic in ('savol', 'taklif', 'murojaat', 'boshqa'));
