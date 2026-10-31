import { differenceInCalendarDays, startOfDay } from "date-fns";
import type { Case } from "@/lib/types/database";
import { parseDateOnly } from "@/lib/utils/case";

/**
 * Intake triage — a pure, deterministic read of a case's facts.
 *
 * Display only: the admin case page shows the verdict. Nothing acts on it yet.
 * Approve-and-send (ops/BACKLOG.md) will use `accept` to decide when Letter 1
 * is offered to the tenant.
 *
 * Conservative by design: `decline` only when a fact rules the case out
 * (property clearly outside Connecticut). Anything uncertain is `review`.
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
> & { has_lease: boolean };

// Checks whose failure rules the case out. Every other failure or unknown means review.
const DECLINE_ON_FAIL: ReadonlySet<TriageCheckId> = new Set(["connecticut"]);
// Shown to the admin but never block `accept`.
const INFORMATIONAL: ReadonlySet<TriageCheckId> = new Set(["residential"]);

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

  // Intake has no residential/commercial field. Sign-up states "residential
  // tenants only", so this is informational until intake records it.
  checks.push({
    id: "residential",
    status: "unknown",
    detail: "Not recorded per case; sign-up says residential tenants only",
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
    if (check.status === "pass" || INFORMATIONAL.has(check.id)) continue;
    if (check.status === "fail" && DECLINE_ON_FAIL.has(check.id)) {
      verdict = "decline";
      break;
    }
    verdict = "review";
  }

  return { verdict, checks };
}
