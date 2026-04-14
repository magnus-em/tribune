export type CaseStatus =
  | "intake_submitted"
  | "under_review"
  | "letter_ready"
  | "letter_sent"
  | "awaiting_landlord"
  | "landlord_responded"
  | "resolved"
  | "closed";

export type MessageType =
  | "tribune_letter"
  | "tribune_update"
  | "tenant_response"
  | "tenant_landlord_reply"
  | "system";

export type ActionType = "letter_sent" | "resolution_reported" | "payment_received";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  tenant_id: string;
  status: CaseStatus;
  property_address: string;
  unit_number: string | null;
  landlord_name: string;
  landlord_email: string | null;
  landlord_phone: string | null;
  landlord_address: string | null;
  lease_start_date: string;
  lease_end_date: string;
  move_out_date: string;
  forwarding_address: string | null;
  deposit_amount_cents: number;
  deposit_returned_cents: number;
  amount_withheld_cents: number;
  withholding_reason: string | null;
  itemized_deductions_received: boolean;
  situation_description: string;
  contingency_pct: number;
  contingency_agreed_at: string | null;
  current_letter_number: number;
  statutory_deadline: string;
  created_at: string;
  updated_at: string;
}

export interface CaseMessage {
  id: string;
  case_id: string;
  message_type: MessageType;
  title: string;
  body: string;
  letter_number: number | null;
  is_admin_only: boolean;
  created_by: string;
  created_at: string;
}

export interface CaseAction {
  id: string;
  case_id: string;
  action_type: ActionType;
  metadata: Record<string, unknown>;
  created_at: string;
}

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
