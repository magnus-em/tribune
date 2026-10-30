-- 🔴 Magnus runs this once, in the Supabase SQL editor, on PROD.
-- Creates a login role the operating agent uses for metrics and the exception
-- queue. It can read public tables and nothing else: no writes, no auth schema,
-- no storage. Replace the password before running; store the resulting
-- connection string as SUPABASE_READONLY_DB_URL (see ops/SETUP.md).

create role tribune_agent_ro login password 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
grant usage on schema public to tribune_agent_ro;
grant select on all tables in schema public to tribune_agent_ro;
alter default privileges in schema public grant select on tables to tribune_agent_ro;
-- RLS would otherwise hide every row from this role. If Supabase refuses
-- BYPASSRLS for your user, stop and leave a note in ops/ESCALATIONS.md — the
-- alternative is per-table SELECT policies for this role, which the agent will draft.
alter role tribune_agent_ro bypassrls;
-- Belt and braces: make every session read-only.
alter role tribune_agent_ro set default_transaction_read_only = on;
