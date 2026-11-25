import { format } from "date-fns";
import { computeDepositDeadline } from "@/lib/deadline-calculator";
import { parseDateOnly } from "@/lib/utils/case";
import type { Case, CaseMessage } from "@/lib/types/database";

/**
 * The § 47a-21(d) deadline a letter may state, for one case.
 *
 * Legal content. Verified text (LEGAL_REVIEW_47a-21.md): "Not later than
 * twenty-one days after termination of a tenancy or fifteen days after
 * receiving written notification of such tenant's forwarding address,
 * whichever is later". The math is `computeDepositDeadline()`; this only maps
 * a case row onto it.
 *
 * The stored `statutory_deadline` column is `move_out_date + 21` and ignores
 * the forwarding-address branch, so letters must not use it as "the deadline".
 *
 * - `forwardingNoticeDate` is the date the landlord received the tenant's
 *   forwarding address in writing (yyyy-MM-dd), or null when it wasn't given
 *   or the tenant doesn't know.
 * - With a date, `deadline` is the later of the two branches and is the date a
 *   letter may state as the deadline.
 * - With null, `deadline` is move-out + 21 and `forwarding_unknown` is true:
 *   that date is only the earliest the deadline could be ("whichever is
 *   later"), so a letter must not state it as a specific date that has passed.
 *
 * Like the stored column, the tenancy branch counts from `move_out_date`.
 * Returns null when the move-out or notice date isn't a valid ISO date.
 */
export type LetterDeadline = {
  deadline: string;
  tenancy_branch_date: string;
  forwarding_branch_date: string | null;
  controlling: "tenancy" | "forwarding" | "both";
  forwarding_unknown: boolean;
};

export function letterDeadline(
  caseRow: Pick<Case, "move_out_date">,
  forwardingNoticeDate: string | null
): LetterDeadline | null {
  const r = computeDepositDeadline({
    tenancy_end_date: caseRow.move_out_date,
    forwarding_address_received_date: forwardingNoticeDate,
  });
  if (!r.ok) return null;
  return {
    deadline: r.deadline,
    tenancy_branch_date: r.tenancy_branch_date,
    forwarding_branch_date: r.forwarding_branch_date,
    controlling: r.controlling,
    forwarding_unknown: r.forwarding_unknown,
  };
}

/**
 * Whether the deadline has passed as of `today` (yyyy-MM-dd). The deadline day
 * itself counts as not passed.
 * - false: the deadline (or, with no forwarding date, even its earliest
 *   possible date) hasn't passed.
 * - true: a known deadline has passed.
 * - null: no forwarding date, and only the earliest possible date has passed.
 *   The real deadline may be later, so neither answer can be stated.
 */
export function letterDeadlinePassed(d: LetterDeadline, today: string): boolean | null {
  const passed = today > d.deadline;
  if (!passed) return false;
  return d.forwarding_unknown ? null : true;
}

// ── The tenant's forwarding-notice answer ────────────────────────────────────

/**
 * Marker on a tenant-visible system message (`case_messages.dispatch_metadata`)
 * recording when the landlord received the tenant's forwarding address in
 * writing. Same pattern as the residential answer: no migration needed.
 */
export const FORWARDING_NOTICE_ATTESTATION_KIND = "forwarding_notice";

/**
 * - `date`: the landlord received it in writing on `notice_date`.
 * - `not_given`: the tenant didn't give it in writing.
 * - `unknown`: the tenant doesn't know.
 * Both of the last two leave the forwarding branch unknown, so letters treat
 * the 21-day date only as the earliest the deadline could be.
 */
export type ForwardingNoticeKind = "date" | "not_given" | "unknown";

export type ForwardingNoticeAnswer = {
  answer: ForwardingNoticeKind;
  /** yyyy-MM-dd when `answer` is "date", otherwise null. */
  notice_date: string | null;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function forwardingNoticeAttestationMetadata(
  answer: ForwardingNoticeAnswer,
  answeredAt: string
) {
  return {
    attestation: FORWARDING_NOTICE_ATTESTATION_KIND,
    answer: answer.answer,
    notice_date: answer.answer === "date" ? answer.notice_date : null,
    answered_at: answeredAt,
  };
}

/**
 * The tenant's recorded forwarding-notice answer; the latest valid one wins.
 * null when none is on record. A "date" answer without a valid yyyy-MM-dd date
 * is ignored rather than guessed at.
 */
export function forwardingNoticeAnswer(
  messages: Pick<CaseMessage, "message_type" | "dispatch_metadata" | "created_at">[]
): ForwardingNoticeAnswer | null {
  let found: ForwardingNoticeAnswer | null = null;
  let at = -Infinity;
  for (const m of messages) {
    if (m.message_type !== "system") continue;
    const meta = m.dispatch_metadata;
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) continue;
    if (meta.attestation !== FORWARDING_NOTICE_ATTESTATION_KIND) continue;
    let answer: ForwardingNoticeAnswer;
    if (meta.answer === "date" && isIsoDate(meta.notice_date)) {
      answer = { answer: "date", notice_date: meta.notice_date };
    } else if (meta.answer === "not_given" || meta.answer === "unknown") {
      answer = { answer: meta.answer, notice_date: null };
    } else {
      continue;
    }
    const t = new Date(m.created_at).getTime();
    if (t >= at) {
      at = t;
      found = answer;
    }
  }
  return found;
}

/**
 * The deadline letters and triage use for a case: `letterDeadline()` from the
 * tenant's forwarding-notice answer (none on record counts as unknown), never
 * earlier than the stored `statutory_deadline`. Taking the later date means a
 * stored value can only delay a letter, never let one go out early.
 * `forwarding_unknown` carries over: with no notice date, the date is only the
 * earliest the deadline could be.
 */
export function caseLetterDeadline(
  caseRow: Pick<Case, "move_out_date" | "statutory_deadline">,
  notice: ForwardingNoticeAnswer | null
): { deadline: string; forwarding_unknown: boolean } {
  const d = letterDeadline(caseRow, notice?.notice_date ?? null);
  if (!d) return { deadline: caseRow.statutory_deadline, forwarding_unknown: true };
  const deadline = caseRow.statutory_deadline > d.deadline ? caseRow.statutory_deadline : d.deadline;
  return { deadline, forwarding_unknown: d.forwarding_unknown };
}

/**
 * Validate the tenant's forwarding-notice answer from the case page before it's
 * recorded. `today` is yyyy-MM-dd. A "date" answer needs a real calendar date
 * that isn't in the future; the other two answers carry no date (any date sent
 * with them is dropped).
 */
export function parseForwardingNoticeInput(
  answer: string,
  noticeDate: string | null | undefined,
  today: string
): { ok: true; value: ForwardingNoticeAnswer } | { ok: false; message: string } {
  if (answer === "not_given" || answer === "unknown") {
    return { ok: true, value: { answer, notice_date: null } };
  }
  if (answer !== "date") return { ok: false, message: "Choose one of the answers." };
  const date = noticeDate?.trim() ?? "";
  if (!isIsoDate(date)) return { ok: false, message: "Enter the date the landlord received it." };
  if (date > today) return { ok: false, message: "That date is in the future. Enter the date the landlord received it." };
  return { ok: true, value: { answer: "date", notice_date: date } };
}

/** The tenant-visible timeline entry for a recorded answer. */
export function forwardingNoticeMessage(answer: ForwardingNoticeAnswer): { title: string; body: string } {
  const title = "Forwarding address notice recorded";
  switch (answer.answer) {
    case "date":
      return {
        title,
        body: `You told Tribune your landlord received your forwarding address in writing on ${format(parseDateOnly(answer.notice_date!), "MMMM d, yyyy")}.`,
      };
    case "not_given":
      return { title, body: "You told Tribune you didn't give your landlord your forwarding address in writing." };
    case "unknown":
      return { title, body: "You told Tribune you don't know when your landlord received your forwarding address in writing." };
  }
}
