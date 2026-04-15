-- First Vertical Slice Migration
-- Adds: pending_cases, case_documents, document_kind enum, new case_status values, new case fields

-- ============================================
-- ENUMS - Add new values to existing enums
-- ============================================

-- Add new case status values
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'awaiting_tenant';
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'in_collections';
ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'dead';

-- Create document_kind enum
CREATE TYPE document_kind AS ENUM (
  'lease',
  'landlord_correspondence',
  'deduction_itemization',
  'photo',
  'other'
);

-- ============================================
-- PENDING_CASES - Holds intake data before auth
-- ============================================

CREATE TABLE pending_cases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX idx_pending_cases_email ON pending_cases(email);
CREATE INDEX idx_pending_cases_expires_at ON pending_cases(expires_at);

-- RLS: No direct client access - server actions only
ALTER TABLE pending_cases ENABLE ROW LEVEL SECURITY;

-- No policies = no client access. Server actions use service role or run under user session.

-- ============================================
-- CASE_DOCUMENTS - Uploaded files metadata
-- ============================================

CREATE TABLE case_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  kind document_kind NOT NULL,
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  content_type text,
  size_bytes integer,
  uploaded_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);

-- RLS for case_documents
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

-- Tenants can read documents for their own cases
CREATE POLICY "Tenants can read own case documents"
  ON case_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cases WHERE cases.id = case_documents.case_id AND cases.tenant_id = auth.uid()
    )
  );

-- Tenants can insert documents for their own cases
CREATE POLICY "Tenants can insert documents for own cases"
  ON case_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cases WHERE cases.id = case_documents.case_id AND cases.tenant_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Admins can read all documents
CREATE POLICY "Admins can read all documents"
  ON case_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can insert all documents
CREATE POLICY "Admins can insert all documents"
  ON case_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can delete documents
CREATE POLICY "Admins can delete all documents"
  ON case_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- CASES - Add new fields for resolution tracking
-- ============================================

ALTER TABLE cases ADD COLUMN IF NOT EXISTS amount_recovered_cents integer;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS fee_collected_cents integer;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS tenant_costs_cents integer;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS resolution_notes text;

-- Update default contingency to 15% (new cases only; existing keep their value)
ALTER TABLE cases ALTER COLUMN contingency_pct SET DEFAULT 15;

-- ============================================
-- STORAGE BUCKET (create via Supabase dashboard or SQL)
-- ============================================

-- Note: Storage buckets and policies are typically created via Supabase dashboard.
-- If using SQL, you'd use the storage schema:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('case-documents', 'case-documents', false);

-- Storage RLS policies would be:
-- Tenants can upload to their own case folders
-- Admins can read/write all

-- This is handled in the dashboard setup step for now.
