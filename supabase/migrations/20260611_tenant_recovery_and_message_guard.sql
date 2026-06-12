-- Two RLS fixes surfaced by an end-to-end audit (2026-06-11).
--
-- 1) Tenants had NO UPDATE policy on `cases`, so the tenant-side
--    reportRecovery() server action (which runs under the tenant session and
--    sets deposit_returned_cents + status='resolved') was SILENTLY denied —
--    Supabase returns no error on a 0-row update, so the action then created
--    and emailed an invoice while the case never actually resolved. Tenants
--    could not close their own case. This policy lets a tenant update only
--    their own case row.
--
-- 2) The tenant case_messages INSERT policy checked case ownership but not
--    message_type, so a tenant could forge `tribune_letter` / `tribune_update`
--    / `landlord_reply` rows that render in both the tenant and admin
--    timelines as if they came from Tribune or the landlord. Restrict tenant
--    inserts to the message types tenant flows actually use ('system').

-- ── 1. Tenant can update own case ────────────────────────────────────────────
drop policy if exists "Tenants can update own cases" on cases;
create policy "Tenants can update own cases"
  on cases for update
  using (tenant_id = auth.uid())
  with check (tenant_id = auth.uid());

-- ── 2. Restrict tenant message inserts by type ───────────────────────────────
drop policy if exists "Tenants can insert messages for own cases" on case_messages;
create policy "Tenants can insert messages for own cases"
  on case_messages for insert
  with check (
    exists (
      select 1 from cases
      where cases.id = case_messages.case_id
        and cases.tenant_id = auth.uid()
    )
    -- Tenants may only create system entries (e.g. "document uploaded",
    -- "introduced Tribune"). Tribune/landlord message types are admin- or
    -- webhook-only.
    and message_type = 'system'
  );
