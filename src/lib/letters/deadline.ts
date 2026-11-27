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
export function letterDeadlinePassed(
  d: Pick<LetterDeadline, "deadline" | "forwarding_unknown">,
  today: string
): boolean | null {
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

// ── How the tenant sees the deadline ─────────────────────────────────────────

/**
 * Plain-language restatement of the verified § 47a-21(d) deadline clause
 * ("twenty-one days after termination of a tenancy or fifteen days after
 * receiving written notification of such tenant's forwarding address, whichever
 * is later"). Shown wherever the tenant sees an earliest-possible date.
 */
export const DEADLINE_RULE_SUMMARY =
  "Under CT § 47a-21(d), the deadline is 21 days after the tenancy ends or 15 days after the landlord receives the tenant's forwarding address in writing, whichever is later.";

export type TenantDeadlineDisplay = {
  /** yyyy-MM-dd */
  date: string;
  /** true when the date is the deadline; false when it's only the earliest it could be. */
  exact: boolean;
  label: string;
};

/**
 * The deadline as the tenant sees it (case page, timeline, emails). Uses
 * `caseLetterDeadline()`, so it matches what the letters say. With no
 * forwarding-notice date on record the date is labeled as the earliest the
 * deadline could be, never as "the deadline".
 */
export function tenantDeadlineDisplay(
  caseRow: Pick<Case, "move_out_date" | "statutory_deadline">,
  notice: ForwardingNoticeAnswer | null
): TenantDeadlineDisplay {
  const d = caseLetterDeadline(caseRow, notice);
  return d.forwarding_unknown
    ? { date: d.deadline, exact: false, label: "Earliest possible deadline" }
    : { date: d.deadline, exact: true, label: "Statutory deadline" };
}

/**
 * Banner title on the case page once a letter has gone out. `today` is
 * yyyy-MM-dd. Counts days only against an exact deadline; with only an
 * earliest-possible date it states no count, since the real deadline may be
 * later.
 */
export function letterSentDeadlineTitle(d: TenantDeadlineDisplay, today: string): string {
  if (!d.exact) return "Tribune sent your letter";
  const days = Math.round(
    (parseDateOnly(today).getTime() - parseDateOnly(d.date).getTime()) / 86_400_000
  );
  const plural = (n: number) => `${n} day${n !== 1 ? "s" : ""}`;
  if (days > 0) return `Tribune sent your letter. The deadline passed ${plural(days)} ago`;
  if (days === 0) return "Tribune sent your letter. Today is the deadline";
  return `Tribune sent your letter. ${plural(-days)} left before the deadline`;
}

// ── Intake review step ───────────────────────────────────────────────────────

export type IntakeDeadlineNotice = {
  /** yyyy-MM-dd: move-out + 21, the earliest the deadline could be. */
  earliest_date: string;
  /** "MMM d, yyyy" */
  earliest_label: string;
  /** true when even the earliest possible date is before `today`. */
  earliest_passed: boolean;
  title: string;
  body: string;
};

/**
 * What the intake step says about the deadline once a move-out date is typed.
 * At intake Tribune doesn't yet know when the landlord received the forwarding
 * address in writing, so move-out + 21 is only the earliest the deadline could
 * be ("whichever is later", § 47a-21(d)). It is never called "the deadline",
 * never said to have passed, and no send-by date is promised. `today` is
 * yyyy-MM-dd. Returns null for an invalid move-out date.
 */
export function intakeDeadlineNotice(
  moveOutDate: string,
  today: string
): IntakeDeadlineNotice | null {
  const d = letterDeadline({ move_out_date: moveOutDate }, null);
  if (!d) return null;
  const earliest_label = format(parseDateOnly(d.deadline), "MMM d, yyyy");
  const earliest_passed = today > d.deadline;
  return {
    earliest_date: d.deadline,
    earliest_label,
    earliest_passed,
    title: `Earliest possible deadline: ${earliest_label}`,
    body: earliest_passed
      ? `${DEADLINE_RULE_SUMMARY} The earliest possible date is before today. The actual deadline may be later. After you submit, Tribune asks when your landlord received your forwarding address in writing to work out the exact date.`
      : `${DEADLINE_RULE_SUMMARY} After you submit, Tribune asks when your landlord received your forwarding address in writing to work out the exact date.`,
  };
}
