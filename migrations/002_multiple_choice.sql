-- Multiple-choice support for easy + medium difficulty.
-- Nullable columns: existing freeform mediums stay freeform (grandfathered).
-- New easy + medium gens populate both; grading compares correct_index directly.

alter table questions add column if not exists options       jsonb;
alter table questions add column if not exists correct_index int;
