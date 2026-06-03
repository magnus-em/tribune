/**
 * Business Constants
 *
 * These values are treated as business rules, not configuration.
 * Changes to these values are business decisions and should be made deliberately.
 *
 * Historical cases retain the values they were created with (stored in database).
 * Only new cases use these defaults.
 */

// Contingency fee percentage (15%)
export const CONTINGENCY_PCT = 15;

// Statutory deadline in days after tenancy ends (CT § 47a-21)
// 21 days to return deposit or provide itemized deductions.
// If tenant hasn't provided forwarding address, landlord gets 15 days after receiving it.
export const STATUTE_DAYS = 21;

// Letter sequence limits
export const MIN_LETTER_NUMBER = 1;
export const MAX_LETTER_NUMBER = 3;

// Jurisdiction
export const JURISDICTION = "Connecticut";
export const JURISDICTION_CODE = "CT";

// File upload limits
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

// Pending case expiration
export const PENDING_CASE_TTL_HOURS = 24;

// Payment
export const PAYMENT_DUE_DAYS = 7; // days after recovery report to pay Tribune fee

// Email config
export const EMAIL_FROM_NAME = "Tribune";
export const EMAIL_FROM_DEFAULT = "hello@usetribune.org";

// Marker title for the system message logged when a tenant confirms they sent
// the introductory "I've authorized Tribune" email to their landlord. Used to
// detect the agency hand-off on both tenant and admin views.
export const INTRO_SENT_TITLE = "Tenant introduced Tribune to landlord";
