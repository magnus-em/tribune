-- Add photo_move_in and photo_move_out to document_kind enum
ALTER TYPE document_kind ADD VALUE IF NOT EXISTS 'photo_move_in';
ALTER TYPE document_kind ADD VALUE IF NOT EXISTS 'photo_move_out';

-- Add contingency signature name to cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS contingency_signature_name text;

-- Add optional description to case_documents
ALTER TABLE case_documents ADD COLUMN IF NOT EXISTS description text;
