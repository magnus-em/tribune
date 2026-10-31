import { addBusinessDays, format } from "date-fns";
import type { CaseAction, CaseMessage, CaseStatus } from "@/lib/types/database";
import { MAX_LETTER_NUMBER } from "@/lib/constants";

/**
 * Follow-up schedule — when Tribune offers the tenant Letter 2 or Letter 3.
 *
 * Pure and deterministic. "Offer" means the tenant may review and approve the
 * next letter in the app; nothing here sends anything. A letter still goes to
 * the landlord only after the tenant's recorded approval (approve-and-send).
 *
 * Rules (BACKLOG "Follow-up cron"):
 * - Letter 2: 10 business days after Letter 1 was sent.
 * - Letter 3: 7 business days after Letter 2 was sent.
 * - Only while the case is `awaiting_landlord`, with no landlord reply since
 *   the last letter and no recovery reported.
 *
 * Business days skip Saturdays and Sundays only. Public holidays are not
 * modeled, so a wait that spans a holiday ends one day early.
 *
 * These waits are Tribune's product cadence, not statutory periods.
 */

export const FOLLOW_UP_WAIT_BUSINESS_DAYS: Readonly<Record<number, number>> = {
  2: 10,
  3: 7,
};

const LANDLORD_REPLY_TYPES: ReadonlySet<CaseMessage["message_type"]> = new Set([
  "landlord_reply",
  "tenant_landlord_reply",
]);

export type FollowUpCase = { status: CaseStatus; current_letter_number: number };

export interface FollowUpInput {
  caseRow: FollowUpCase;
  messages: Pick<CaseMessage, "message_type" | "created_at">[];
  actions: Pick<CaseAction, "action_type" | "metadata" | "created_at">[];
  now?: Date;
}

export type FollowUpBlockReason =
  | "no_more_letters"
  | "status"
  | "recovery_reported"
  | "landlord_replied"
  | "no_dispatch_record"
  | "not_yet";

export type FollowUpOffer =
  | { due: true; letterNumber: number; dueOn: Date; letterDates: Record<number, Date> }
  | {
      due: false;
      reason: FollowUpBlockReason;
      letterNumber: number | null;
      // Set when the only thing missing is time.
      dueOn?: Date;
    };

function parseTime(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * When each letter was sent, from the `letter_dispatched` audit rows. Both the
 * tenant approve-and-send path and the admin dispatch path write these with
 * `letter_number` and `sent_at`. If a letter was dispatched twice, the first
 * send counts.
 */
export function letterDispatchDates(actions: FollowUpInput["actions"]): Record<number, Date> {
  const dates: Record<number, Date> = {};
  for (const a of actions) {
    if (a.action_type !== "letter_dispatched") continue;
    const meta = (a.metadata ?? {}) as { letter_number?: unknown; sent_at?: unknown };
    const n = typeof meta.letter_number === "number" ? meta.letter_number : null;
    if (n === null || !Number.isInteger(n) || n < 1 || n > MAX_LETTER_NUMBER) continue;
    const at = parseTime(meta.sent_at) ?? parseTime(a.created_at);
    if (!at) continue;
    if (!dates[n] || at < dates[n]) dates[n] = at;
  }
  return dates;
}

/** Whether the next letter (2 or 3) is offered to the tenant now, and if not, why. */
export function followUpOffer(input: FollowUpInput): FollowUpOffer {
  const now = input.now ?? new Date();
  const { caseRow } = input;
  const next = caseRow.current_letter_number + 1;

  if (!(next in FOLLOW_UP_WAIT_BUSINESS_DAYS)) {
    return { due: false, reason: "no_more_letters", letterNumber: null };
  }
  if (caseRow.status !== "awaiting_landlord") {
    return { due: false, reason: "status", letterNumber: next };
  }
  if (input.actions.some((a) => a.action_type === "resolution_reported")) {
    return { due: false, reason: "recovery_reported", letterNumber: next };
  }

  const letterDates = letterDispatchDates(input.actions);
  // Every earlier letter must have a dispatch record: Letter 3 cites the dates of 1 and 2.
  for (let n = 1; n < next; n++) {
    if (!letterDates[n]) return { due: false, reason: "no_dispatch_record", letterNumber: next };
  }
  const previous = letterDates[next - 1];

  const replied = input.messages.some((m) => {
    if (!LANDLORD_REPLY_TYPES.has(m.message_type)) return false;
    const at = parseTime(m.created_at);
    return at !== null && at >= previous;
  });
  if (replied) return { due: false, reason: "landlord_replied", letterNumber: next };

  const dueOn = addBusinessDays(previous, FOLLOW_UP_WAIT_BUSINESS_DAYS[next]);
  if (now < dueOn) return { due: false, reason: "not_yet", letterNumber: next, dueOn };

  return { due: true, letterNumber: next, dueOn, letterDates };
}

/** Tenant-facing explanation for a follow-up letter that isn't offered. Tribune voice. */
export function followUpBlockMessage(offer: Extract<FollowUpOffer, { due: false }>): string {
  const n = offer.letterNumber;
  switch (offer.reason) {
    case "no_more_letters":
      return "There are no more letters in Tribune's sequence for this case.";
    case "status":
      return `Letter ${n} is offered only while Tribune is waiting on your landlord.`;
    case "recovery_reported":
      return "A recovery has been reported on this case, so Tribune isn't offering another letter.";
    case "landlord_replied":
      return `Your landlord replied after the last letter, so Letter ${n} isn't offered automatically.`;
    case "no_dispatch_record":
      return `Tribune can't find the send date of an earlier letter, so Letter ${n} needs review first.`;
    case "not_yet":
      return offer.dueOn
        ? `Letter ${n} becomes available on ${format(offer.dueOn, "MMMM d, yyyy")}.`
        : `Letter ${n} isn't available yet.`;
  }
}

/**
 * The next letter after a landlord reply (status `landlord_responded`).
 *
 * The landlord answered, so Tribune doesn't offer the next letter on its own
 * schedule (`followUpOffer` stops at `landlord_replied`, and the daily cron only
 * looks at `awaiting_landlord`). Instead the tenant page shows the reply with
 * the options, and the tenant may choose to review the next letter. This says
 * whether that letter can be offered: same sequence, same dispatch-record and
 * recovery rules, and the reply must have come after the last letter. There is
 * no business-day wait; the 5-day cooldown in `prepareLetterDispatch` still
 * applies, and so does the tenant's approval.
 */
export function replyFollowUpOffer(input: FollowUpInput): FollowUpOffer {
  const { caseRow } = input;
  const next = caseRow.current_letter_number + 1;

  if (!(next in FOLLOW_UP_WAIT_BUSINESS_DAYS)) {
    return { due: false, reason: "no_more_letters", letterNumber: null };
  }
  if (caseRow.status !== "landlord_responded") {
    return { due: false, reason: "status", letterNumber: next };
  }
  if (input.actions.some((a) => a.action_type === "resolution_reported")) {
    return { due: false, reason: "recovery_reported", letterNumber: next };
  }

  const letterDates = letterDispatchDates(input.actions);
  for (let n = 1; n < next; n++) {
    if (!letterDates[n]) return { due: false, reason: "no_dispatch_record", letterNumber: next };
  }
  const previous = letterDates[next - 1];

  const replyTimes = input.messages
    .filter((m) => LANDLORD_REPLY_TYPES.has(m.message_type))
    .map((m) => parseTime(m.created_at))
    .filter((at): at is Date => at !== null && at >= previous);
  // A `landlord_responded` case with no reply since the last letter is out of
  // step; leave it to Tribune's review.
  if (replyTimes.length === 0) return { due: false, reason: "status", letterNumber: next };

  const dueOn = new Date(Math.min(...replyTimes.map((t) => t.getTime())));
  return { due: true, letterNumber: next, dueOn, letterDates };
}

/** The most recent landlord reply on the case, or null. For the tenant page. */
export function latestLandlordReply<T extends Pick<CaseMessage, "message_type" | "created_at">>(
  messages: T[]
): T | null {
  let latest: T | null = null;
  let latestAt = -Infinity;
  for (const m of messages) {
    if (!LANDLORD_REPLY_TYPES.has(m.message_type)) continue;
    const at = parseTime(m.created_at);
    if (!at) continue;
    if (at.getTime() >= latestAt) {
      latest = m;
      latestAt = at.getTime();
    }
  }
  return latest;
}
