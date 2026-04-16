-- Fix storage RLS policies for case-documents bucket.
-- Both INSERT and SELECT were using foldername(name)[1] which returns the
-- 'case_documents' prefix string instead of [2] which is the actual case UUID.

DROP POLICY IF EXISTS "Tenants can upload to own case folders" ON storage.objects;
CREATE POLICY "Tenants can upload to own case folders"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'case-documents'
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM cases WHERE tenant_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Tenants can read own case documents" ON storage.objects;
CREATE POLICY "Tenants can read own case documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'case-documents'
  AND (storage.foldername(name))[2] IN (
    SELECT id::text FROM cases WHERE tenant_id = auth.uid()
  )
);
