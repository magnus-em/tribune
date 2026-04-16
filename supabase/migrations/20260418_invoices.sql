-- ============================================
-- INVOICES
-- Tribune service fee invoices, generated at case resolution.
-- ============================================

-- Sequence for human-readable invoice numbers (global, does not reset per year)
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- SECURITY DEFINER so any authenticated user can call nextval without sequence ownership
CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'TRB-' || to_char(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::text, 4, '0');
$$;

CREATE TABLE invoices (
  id                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id           uuid        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  invoice_number    text        NOT NULL UNIQUE,
  amount_cents      integer     NOT NULL,
  status            text        NOT NULL DEFAULT 'pending',
  -- status values: pending | paid | overdue | collections | waived
  due_date          date        NOT NULL,
  paid_at           timestamptz,
  payment_method    text,
  -- payment_method values: venmo | zelle | stripe | waived
  payment_reference text,       -- e.g. Venmo transaction ID or Zelle confirmation number
  notes             text,
  -- stripe_payment_intent_id is reserved for future Stripe integration
  stripe_payment_intent_id text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_case_id ON invoices(case_id);
CREATE INDEX idx_invoices_status  ON invoices(status);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Tenants can view invoices for their own cases
CREATE POLICY "Tenants can read their own invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = invoices.case_id
        AND cases.tenant_id = auth.uid()
    )
  );

-- Tenants can create invoices for their own cases (triggered by reportRecovery server action)
CREATE POLICY "Tenants can create invoices for their own cases"
  ON invoices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = invoices.case_id
        AND cases.tenant_id = auth.uid()
    )
  );

-- Admins have full access
CREATE POLICY "Admins can manage all invoices"
  ON invoices FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
