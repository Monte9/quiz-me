-- Hard/xhard questions no longer pre-generate a reference answer.
-- Their grade (written at submit time) carries the reference material
-- instead. answer_key stays populated for easy/medium (used by the
-- reveal UI) and for grandfathered hard/xhard rows.

alter table questions alter column answer_key drop not null;
