import { computeDepositDeadline } from "@/lib/deadline-calculator";
import type { Case } from "@/lib/types/database";

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
