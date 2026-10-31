import { differenceInDays, format } from "date-fns";
import type { Case, CaseAction, CaseMessage, CaseStatus, Profile } from "@/lib/types/database";
import { triageCase } from "@/lib/triage";
import { parseDateOnly } from "@/lib/utils/case";
import { MAX_LETTER_NUMBER, MIN_LETTER_NUMBER } from "@/lib/constants";
import { generateDemandLetter, type LetterData } from "./templates";
import { followUpBlockMessage, followUpOffer } from "./follow-up";

/**
 * Tenant approve-and-send — the pure half.
 *
 * The tenant approves Letter N in the app and Tribune sends it to the landlord.
 * Everything here is deterministic so the rules can be tested without a
 * database: who may send, when, and exactly what text goes out. The server
 * action (`approveAndSendLetter`) loads the rows, calls `prepareLetterDispatch`,
 * and only then writes and sends.
 *
 * The letter is always regenerated from the case row. No caller passes letter
 * text in, so a tenant can't send anything other than the template.
 */

// Minimum gap between two dispatches on one case.
export const DISPATCH_COOLDOWN_DAYS = 5;

// Statuses in which the tenant may approve Letter 1. `correspondence_ready`
// means Tribune staged a letter through the admin flow; that path stays separate.
const LETTER_1_STATUSES: ReadonlySet<CaseStatus> = new Set(["intake_submitted", "under_review"]);

export const APPROVAL_STATEMENT =
  "I've read this letter, it's accurate, and I authorize Tribune to send it to my landlord in my name.";

export type DispatchBlockReason =
  | "dispatch_paused"
  | "letter_not_offered"
  | "wrong_letter_number"
  | "status"
  | "no_landlord_email"
  | "no_forwarding_address"
  | "triage"
  | "cooldown";

export type LetterCase = Pick<
  Case,
  | "status"
  | "current_letter_number"
  | "property_address"
  | "unit_number"
  | "move_out_date"
  | "lease_start_date"
  | "lease_end_date"
  | "landlord_name"
  | "landlord_email"
  | "landlord_address"
  | "forwarding_address"
  | "deposit_amount_cents"
  | "amount_withheld_cents"
  | "deposit_returned_cents"
  | "statutory_deadline"
  | "itemized_deductions_received"
  | "situation_description"
  | "withholding_reason"
>;

export type LetterProfile = Pick<Profile, "full_name" | "email" | "phone">;

export interface DispatchInput {
  caseRow: LetterCase;
  profile: LetterProfile;
  messages: Pick<CaseMessage, "message_type" | "dispatch_metadata" | "created_at">[];
  actions: Pick<CaseAction, "action_type" | "metadata" | "created_at">[];
  hasLease: boolean;
  letterNumber: number;
  // Raw value of the DISPATCH_PAUSED env var.
  dispatchPaused: string | undefined;
  now?: Date;
}

export type DispatchPlan =
  | { ok: true; title: string; body: string }
  | {
      ok: false;
      reason: DispatchBlockReason;
      message: string;
      // Set only when the follow-up schedule's wait is the one thing missing
      // (yyyy-MM-dd). The case page shows "Letter N becomes available on …".
      availableOn?: string;
    };

export function isDispatchPaused(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

/**
 * The same LetterData the admin page builds, from the case row and profile.
 * The tenant's forwarding address is where the landlord is told to send payment.
 */
export function buildLetterData(
  caseRow: LetterCase,
  profile: LetterProfile,
  landlordResponded: boolean,
  now: Date = new Date()
): LetterData {
  const deadline = parseDateOnly(caseRow.statutory_deadline);
  return {
    tenantName: profile.full_name,
    tenantAddress: caseRow.forwarding_address ?? "",
    tenantPhone: profile.phone ?? undefined,
    tenantEmail: profile.email,
    landlordName: caseRow.landlord_name,
    landlordAddress: caseRow.landlord_address ?? undefined,
    propertyAddress: caseRow.property_address,
    unitNumber: caseRow.unit_number ?? undefined,
    leaseStartDate: caseRow.lease_start_date,
    leaseEndDate: caseRow.lease_end_date,
    moveOutDate: caseRow.move_out_date,
    depositAmountCents: caseRow.deposit_amount_cents,
    amountWithheldCents: caseRow.amount_withheld_cents,
    depositReturnedCents: caseRow.deposit_returned_cents,
    statutoryDeadline: caseRow.statutory_deadline,
    daysOverdue: Math.max(0, differenceInDays(now, deadline)),
    itemizedDeductionsReceived: caseRow.itemized_deductions_received,
    landlordResponded,
    situationDescription: caseRow.situation_description,
    withholding_reason: caseRow.withholding_reason ?? undefined,
  };
}

export function letterTitle(letterNumber: number, propertyAddress: string): string {
  return `Demand Letter ${letterNumber} — ${propertyAddress}`;
}

function sentAt(metadata: unknown): Date | null {
  const value = (metadata as { sent_at?: unknown } | null)?.sent_at;
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The most recent dispatch on the case, from letter messages or the audit log. */
export function lastDispatchAt(
  messages: DispatchInput["messages"],
  actions: DispatchInput["actions"]
): Date | null {
  const times: Date[] = [];
  for (const m of messages) {
    if (m.message_type !== "tribune_letter") continue;
    const t = sentAt(m.dispatch_metadata);
    if (t) times.push(t);
  }
  for (const a of actions) {
    if (a.action_type !== "letter_dispatched") continue;
    times.push(sentAt(a.metadata) ?? new Date(a.created_at));
  }
  if (times.length === 0) return null;
  return new Date(Math.max(...times.map((t) => t.getTime())));
}

function block(reason: DispatchBlockReason, message: string): DispatchPlan {
  return { ok: false, reason, message };
}

/**
 * Decide whether Letter N may be sent now and, if so, produce the exact text.
 * Checks run in a fixed order; the first failure is returned.
 */
export function prepareLetterDispatch(input: DispatchInput): DispatchPlan {
  const now = input.now ?? new Date();
  const { caseRow, letterNumber } = input;

  if (isDispatchPaused(input.dispatchPaused)) {
    return block("dispatch_paused", "Tribune has paused sending letters. Try again later.");
  }
  if (
    !Number.isInteger(letterNumber) ||
    letterNumber < MIN_LETTER_NUMBER ||
    letterNumber > MAX_LETTER_NUMBER
  ) {
    return block("letter_not_offered", `Letter ${letterNumber} isn't available to send yet.`);
  }
  if (letterNumber !== caseRow.current_letter_number + 1) {
    return block("wrong_letter_number", `Letter ${letterNumber} isn't the next letter on this case.`);
  }

  // Letters 2 and 3 are offered only by the follow-up schedule, and cite the
  // send dates of the earlier letters.
  let previousLetterDates: { letter1?: string; letter2?: string } | undefined;
  if (letterNumber === 1) {
    if (!LETTER_1_STATUSES.has(caseRow.status)) {
      return block("status", "This case isn't at a stage where Letter 1 can be sent.");
    }
  } else {
    const offer = followUpOffer({ caseRow, messages: input.messages, actions: input.actions, now });
    if (!offer.due) {
      const plan = block(offer.reason === "status" ? "status" : "letter_not_offered", followUpBlockMessage(offer));
      if (!plan.ok && offer.reason === "not_yet" && offer.dueOn) {
        plan.availableOn = format(offer.dueOn, "yyyy-MM-dd");
      }
      return plan;
    }
    const day = (d: Date | undefined) => (d ? format(d, "yyyy-MM-dd") : undefined);
    previousLetterDates = { letter1: day(offer.letterDates[1]), letter2: day(offer.letterDates[2]) };
  }
  if (!caseRow.landlord_email?.trim()) {
    return block("no_landlord_email", "Tribune needs your landlord's email address to send this letter.");
  }
  if (!caseRow.forwarding_address?.trim()) {
    return block("no_forwarding_address", "Tribune needs your forwarding address to send this letter.");
  }

  const triage = triageCase(
    {
      property_address: caseRow.property_address,
      move_out_date: caseRow.move_out_date,
      landlord_email: caseRow.landlord_email,
      amount_withheld_cents: caseRow.amount_withheld_cents,
      statutory_deadline: caseRow.statutory_deadline,
      has_lease: input.hasLease,
    },
    now
  );
  if (triage.verdict !== "accept") {
    return block("triage", "Tribune needs to review this case before a letter can be sent.");
  }

  const last = lastDispatchAt(input.messages, input.actions);
  if (last && now.getTime() - last.getTime() < DISPATCH_COOLDOWN_DAYS * 24 * 60 * 60 * 1000) {
    return block(
      "cooldown",
      `A letter was sent on ${format(last, "MMMM d, yyyy")}. Tribune waits ${DISPATCH_COOLDOWN_DAYS} days between letters.`
    );
  }

  const landlordResponded = input.messages.some(
    (m) => m.message_type === "landlord_reply" || m.message_type === "tenant_landlord_reply"
  );
  const body = generateDemandLetter(
    letterNumber,
    buildLetterData(caseRow, input.profile, landlordResponded, now),
    previousLetterDates
  );
  return { ok: true, title: letterTitle(letterNumber, caseRow.property_address), body };
}

// ── Tenant case page ─────────────────────────────────────────────────────────

// Blockers the tenant can clear on the case page. Everything else (status,
// triage for reasons other than the lease, the kill switch) waits on Tribune.
export type TenantFixableNeed = "landlord_email" | "forwarding_address" | "lease";

export type ApprovalPanelState =
  | { kind: "ready"; title: string; body: string }
  | { kind: "needs"; need: TenantFixableNeed; message: string }
  | { kind: "waiting"; message: string }
  | { kind: "hidden" };

/**
 * Which letter the tenant case page asks the server about, or null for none.
 * Letter 1 during setup; Letters 2 and 3 while Tribune waits on the landlord.
 * The server still decides whether that letter is offered (prepareLetterDispatch).
 */
export function nextLetterToOffer(
  caseRow: Pick<LetterCase, "status" | "current_letter_number">
): number | null {
  const next = caseRow.current_letter_number + 1;
  if (caseRow.current_letter_number === 0) {
    return LETTER_1_STATUSES.has(caseRow.status) ? 1 : null;
  }
  if (caseRow.status !== "awaiting_landlord") return null;
  return next >= MIN_LETTER_NUMBER + 1 && next <= MAX_LETTER_NUMBER ? next : null;
}

/**
 * What the tenant case page shows for Letter N, from the server's plan.
 * A missing lease fails triage, so `triage` with no lease on file is fixable.
 */
export function approvalPanelState(
  plan: DispatchPlan | { ok: false; reason: string; message: string },
  hasLease: boolean
): ApprovalPanelState {
  if (plan.ok) return { kind: "ready", title: plan.title, body: plan.body };
  if (plan.reason === "letter_not_offered" && "availableOn" in plan && plan.availableOn) {
    return { kind: "waiting", message: plan.message };
  }
  switch (plan.reason) {
    case "no_landlord_email":
      return { kind: "needs", need: "landlord_email", message: plan.message };
    case "no_forwarding_address":
      return { kind: "needs", need: "forwarding_address", message: plan.message };
    case "triage":
      return hasLease
        ? { kind: "hidden" }
        : {
            kind: "needs",
            need: "lease",
            message: "Tribune needs a copy of your lease before your letter can be prepared.",
          };
    default:
      return { kind: "hidden" };
  }
}

export type ContactDetailField = "landlord_email" | "forwarding_address";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a detail the tenant adds on the case page so Letter 1 can go out.
 * The forwarding address is where the landlord is told to send payment, so it
 * must at least have a street line and a ZIP.
 */
export function parseContactDetail(
  field: ContactDetailField,
  raw: string
): { ok: true; value: string } | { ok: false; message: string } {
  const value = raw.trim().replace(/\s+/g, " ");
  if (field === "landlord_email") {
    if (value.length > 254 || !EMAIL_RE.test(value)) {
      return { ok: false, message: "Enter a valid email address." };
    }
    return { ok: true, value: value.toLowerCase() };
  }
  if (value.length < 10 || value.length > 300 || !/\b\d{5}(?:-\d{4})?\b/.test(value)) {
    return { ok: false, message: "Enter your full mailing address, including the ZIP code." };
  }
  return { ok: true, value };
}
