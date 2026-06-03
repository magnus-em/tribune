-- Declined-case flow: a case Tribune chose not to take.
-- Distinct from `closed`, which is for cases that proceeded and then ended.

alter type case_status add value if not exists 'declined';

alter table cases add column if not exists declined_at timestamptz;
alter table cases add column if not exists decline_reason text;   -- admin-only, internal note
alter table cases add column if not exists decline_message text;  -- tenant-visible explanation
