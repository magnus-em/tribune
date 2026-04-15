// Auto-generated types from Supabase
import { Database } from './supabase';

// Type aliases for convenience (maps generated types to old interface names)
export type CaseStatus = Database['public']['Enums']['case_status'];
export type MessageType = Database['public']['Enums']['message_type'];
export type ActionType = Database['public']['Enums']['action_type'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Case = Database['public']['Tables']['cases']['Row'];
export type CaseMessage = Database['public']['Tables']['case_messages']['Row'];
export type CaseAction = Database['public']['Tables']['case_actions']['Row'];

// Helper constants (not auto-generated)
export const STATUS_LABELS: Record<CaseStatus, string> = {
  intake_submitted: "Intake Submitted",
  under_review: "Under Review",
  letter_ready: "Letter Ready",
  letter_sent: "Letter Sent",
  awaiting_landlord: "Awaiting Landlord",
  landlord_responded: "Landlord Responded",
  resolved: "Resolved",
  closed: "Closed",
};

export const STATUS_DESCRIPTIONS: Record<CaseStatus, string> = {
  intake_submitted: "We've received your case and will review it shortly.",
  under_review: "We're reviewing your case details.",
  letter_ready: "Your demand letter is ready for review.",
  letter_sent: "You've sent the demand letter to your landlord.",
  awaiting_landlord: "Waiting for your landlord to respond.",
  landlord_responded: "Your landlord has responded. We're preparing next steps.",
  resolved: "Your case has been resolved.",
  closed: "This case has been closed.",
};
