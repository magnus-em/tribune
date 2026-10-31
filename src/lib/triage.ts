import { differenceInCalendarDays, startOfDay } from "date-fns";
import type { Case, CaseMessage } from "@/lib/types/database";
import type { Json } from "@/lib/types/supabase";
import { parseDateOnly } from "@/lib/utils/case";

/**
 * Intake triage — a pure, deterministic read of a case's facts.
 *
 * The admin case page shows the verdict, and approve-and-send requires
 * `accept` before a letter can go out.
 *
 * Conservative by design: `decline` only when a fact rules the case out
 * (property clearly outside Connecticut, or the tenant said the tenancy wasn't
 * residential). Anything uncertain is `review`.
 *
 * This does NOT compute the statutory deadline. It compares the stored
 * `statutory_deadline` to today. The forwarding-address branch of § 47a-21
 * (15 days after the landlord receives it, if later) isn't captured yet, so a
 * stored deadline can be earlier than the real one (BACKLOG: forwarding-address date).
 */

export type TriageVerdict = "accept" | "decline" | "review";
export type TriageCheckStatus = "pass" | "fail" | "unknown";

export type TriageCheckId =
  | "connecticut"
  | "residential"
  | "moved_out"
  | "landlord_email"
  | "amount_withheld"
  | "deadline_passed"
  | "lease_on_file";

export interface TriageCheck {
  id: TriageCheckId;
  status: TriageCheckStatus;
  detail: string;
}

export interface TriageResult {
  verdict: TriageVerdict;
  checks: TriageCheck[];
}

export type TriageInput = Pick<
  Case,
  | "property_address"
  | "move_out_date"
  | "landlord_email"
  | "amount_withheld_cents"
  | "statutory_deadline"
> & {
  has_lease: boolean;
  /**
   * The tenant's intake answer to "did you rent this property as your home?",
   * from `residentialAnswer()`. null when no answer is on record (cases created
   * before intake asked, or the record failed to save).
   */
  residential: boolean | null;
};

/**
 * Marker key on the intake system message (`case_messages.dispatch_metadata`)
 * that records the residential answer. A `case_actions` row would need a new
 * `action_type` enum value, which needs a migration.
 */
export const RESIDENTIAL_ATTESTATION_KIND = "residential_tenancy";

export function residentialAttestationMetadata(residential: boolean, answeredAt: string) {
  return { attestation: RESIDENTIAL_ATTESTATION_KIND, residential, answered_at: answeredAt };
}

/** The tenant's recorded residential answer; the latest one wins. null if none. */
export function residentialAnswer(
  messages: Pick<CaseMessage, "message_type" | "dispatch_metadata" | "created_at">[]
): boolean | null {
  let answer: boolean | null = null;
  let at = -Infinity;
  for (const m of messages) {
    if (m.message_type !== "system") continue;
    const meta: Json | null = m.dispatch_metadata;
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) continue;
    if (meta.attestation !== RESIDENTIAL_ATTESTATION_KIND) continue;
    if (typeof meta.residential !== "boolean") continue;
    const t = new Date(m.created_at).getTime();
    if (t >= at) {
      at = t;
      answer = meta.residential;
    }
  }
  return answer;
}

// Checks whose failure rules the case out. Every other failure or unknown means review.
const DECLINE_ON_FAIL: ReadonlySet<TriageCheckId> = new Set(["connecticut", "residential"]);

const US_STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO",
  "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
  "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]);

/**
 * Where the property is, from the free-text address. CT ZIP codes all start
 * with 06. A ZIP wins over a state token because it's harder to mistype into
 * another valid state. Returns null when the address doesn't say.
 */
export function propertyInConnecticut(address: string): boolean | null {
  const zips = address.match(/\b\d{5}(?:-\d{4})?\b/g);
  if (zips) return zips[zips.length - 1].startsWith("06");

  if (/\bconnecticut\b/i.test(address)) return true;

  const states = address.match(/,\s*([A-Za-z]{2})\b\.?\s*$/);
  if (states) {
    const code = states[1].toUpperCase();
    if (code === "CT") return true;
    if (US_STATE_CODES.has(code)) return false;
  }
  return null;
}

export function triageCase(input: TriageInput, today: Date = new Date()): TriageResult {
  const day = startOfDay(today);
  const checks: TriageCheck[] = [];

  const inCt = propertyInConnecticut(input.property_address);
  checks.push({
    id: "connecticut",
    status: inCt === null ? "unknown" : inCt ? "pass" : "fail",
    detail:
      inCt === null
        ? "Property address doesn't show a state or ZIP"
        : inCt
          ? "Property is in Connecticut"
          : "Property is outside Connecticut",
  });

  // Intake asks whether the tenant rented the property as their home. A case
  // with no recorded answer goes to review rather than being assumed residential.
  checks.push({
    id: "residential",
    status: input.residential === null ? "unknown" : input.residential ? "pass" : "fail",
    detail:
      input.residential === null
        ? "No residential answer on record"
        : input.residential
          ? "Tenant confirmed a residential tenancy at intake"
          : "Tenant said this was not a residential tenancy",
  });

  const movedOut = differenceInCalendarDays(day, parseDateOnly(input.move_out_date)) >= 0;
  checks.push({
    id: "moved_out",
    status: movedOut ? "pass" : "fail",
    detail: movedOut ? "Move-out date has passed" : "Move-out date is in the future",
  });

  const hasEmail = !!input.landlord_email?.trim();
  checks.push({
    id: "landlord_email",
    status: hasEmail ? "pass" : "fail",
    detail: hasEmail ? "Landlord email on file" : "No landlord email; letters can't be emailed",
  });

  // No minimum amount is set yet; that's a business decision (see ops/JOURNAL.md).
  const withheld = input.amount_withheld_cents > 0;
  checks.push({
    id: "amount_withheld",
    status: withheld ? "pass" : "fail",
    detail: withheld ? "Part of the deposit is withheld" : "Nothing withheld",
  });

  const deadlinePassed = differenceInCalendarDays(day, parseDateOnly(input.statutory_deadline)) > 0;
  checks.push({
    id: "deadline_passed",
    status: deadlinePassed ? "pass" : "fail",
    detail: deadlinePassed
      ? "Stored statutory deadline has passed"
      : "Stored statutory deadline hasn't passed yet",
  });

  checks.push({
    id: "lease_on_file",
    status: input.has_lease ? "pass" : "fail",
    detail: input.has_lease ? "Lease uploaded" : "Lease not uploaded",
  });

  let verdict: TriageVerdict = "accept";
  for (const check of checks) {
    if (check.status === "pass") continue;
    if (check.status === "fail" && DECLINE_ON_FAIL.has(check.id)) {
      verdict = "decline";
      break;
    }
    verdict = "review";
  }

  return { verdict, checks };
}
