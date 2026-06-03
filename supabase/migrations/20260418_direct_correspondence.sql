-- ============================================
-- DIRECT CORRESPONDENCE
-- Tribune negotiates directly with landlords.
-- ============================================

-- Rename letter_ready → correspondence_ready (channel-agnostic staging state)
ALTER TYPE case_status RENAME VALUE 'letter_ready' TO 'correspondence_ready';

-- New message type for inbound landlord replies (auto-logged via webhook)
ALTER TYPE message_type ADD VALUE IF NOT EXISTS 'landlord_reply';

-- New action type for outbound dispatches
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'letter_dispatched';

-- Channel enum for outbound correspondence
CREATE TYPE dispatch_channel AS ENUM ('email', 'sms', 'mail');

-- Add dispatch columns to case_messages
-- dispatch_channel: null for non-outbound messages (notes, updates, inbound replies)
-- dispatch_metadata: provider id, destination, sent_at, etc.
ALTER TABLE case_messages
  ADD COLUMN dispatch_channel dispatch_channel,
  ADD COLUMN dispatch_metadata jsonb;
