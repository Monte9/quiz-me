-- Track which Anthropic model generated each question so we can (a) show
-- the tier on the card and (b) analyze cost/quality per tier later.
-- Easy/medium use Haiku (cheap MC gen), hard uses Sonnet, xhard uses Opus.
-- Nullable so grandfathered rows don't need backfill.

alter table questions add column if not exists model text;
