-- The model the assistant starts with: the plain model id (no date suffix) and the strongest of the three,
-- so the school chooses to trade quality for price rather than having that chosen for it. The admin panel
-- offers Sonnet 5 and Haiku 4.5 next to it with their prices.

alter table private.ai_settings alter column model set default 'claude-opus-5';
update private.ai_settings set model = 'claude-opus-5' where model = 'claude-haiku-4-5-20251001';
