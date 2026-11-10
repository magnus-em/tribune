/**
 * Public deposit-deadline calculator (CGS § 47a-21(d)).
 *
 * Legal content. Restates only the verified deadline text in
 * LEGAL_REVIEW_47a-21.md: "Not later than twenty-one days after termination of
 * a tenancy or fifteen days after receiving written notification of such
 * tenant's forwarding address, whichever is later".
 *
 * Pure date math on ISO `yyyy-MM-dd` strings, counted in calendar days. The
 * verified text says nothing about weekends, holidays, or how a court counts
 * days, so this module doesn't adjust for them; the page says so.
 */

import { addDays, differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import { STATUTE_DAYS } from "@/lib/constants";

/** Days after the landlord receives written notice of the forwarding address. */
export const FORWARDING_ADDRESS_DAYS = 15;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type DeadlineInput = {
  /** Date the tenancy terminated (ISO yyyy-MM-dd). */
  tenancy_end_date: string;
  /** Date the landlord received the forwarding address in writing, if known. */
  forwarding_address_received_date?: string | null;
};

export type DeadlineResult =
  | { ok: false; error: string }
  | {
      ok: true;
      /** tenancy end + 21 days */
      tenancy_branch_date: string;
      /** forwarding-address receipt + 15 days, or null when no date was given */
      forwarding_branch_date: string | null;
      /** The later of the two branches. With no forwarding date, the 21-day date. */
      deadline: string;
      /** Which branch sets the deadline. "both" when they fall on the same day. */
      controlling: "tenancy" | "forwarding" | "both";
      /**
       * True when no forwarding-address date was given. The deadline shown is
       * then the earliest it can be: a later forwarding notice could only move
       * it later ("whichever is later").
       */
      forwarding_unknown: boolean;
      /**
       * A forwarding notice received after this date sets a later deadline
       * than the 21-day branch (tenancy end + 21 − 15 days).
       */
      forwarding_later_after: string;
    };

function parseDate(value: string): Date | null {
  if (!ISO_DATE.test(value)) return null;
  const d = parseISO(value);
  if (!isValid(d)) return null;
  // Reject roll-overs like 2026-02-31.
  return format(d, "yyyy-MM-dd") === value ? d : null;
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

export function computeDepositDeadline(input: DeadlineInput): DeadlineResult {
  const end = parseDate(input.tenancy_end_date ?? "");
  if (!end) return { ok: false, error: "Enter the date your tenancy ended." };

  const tenancyBranch = addDays(end, STATUTE_DAYS);
  const forwardingLaterAfter = iso(addDays(end, STATUTE_DAYS - FORWARDING_ADDRESS_DAYS));

  const fwdRaw = input.forwarding_address_received_date?.trim() || "";
  if (!fwdRaw) {
    return {
      ok: true,
      tenancy_branch_date: iso(tenancyBranch),
      forwarding_branch_date: null,
      deadline: iso(tenancyBranch),
      controlling: "tenancy",
      forwarding_unknown: true,
      forwarding_later_after: forwardingLaterAfter,
    };
  }

  const fwd = parseDate(fwdRaw);
  if (!fwd) return { ok: false, error: "Enter a valid date for the forwarding address, or leave it blank." };

  const forwardingBranch = addDays(fwd, FORWARDING_ADDRESS_DAYS);
  const diff = differenceInCalendarDays(forwardingBranch, tenancyBranch);

  return {
    ok: true,
    tenancy_branch_date: iso(tenancyBranch),
    forwarding_branch_date: iso(forwardingBranch),
    deadline: iso(diff > 0 ? forwardingBranch : tenancyBranch),
    controlling: diff > 0 ? "forwarding" : diff < 0 ? "tenancy" : "both",
    forwarding_unknown: false,
    forwarding_later_after: forwardingLaterAfter,
  };
}

/** Whole calendar days from `today` to `deadline` (negative once it has passed). */
export function daysUntil(deadline: string, today: string): number | null {
  const d = parseDate(deadline);
  const t = parseDate(today);
  if (!d || !t) return null;
  return differenceInCalendarDays(d, t);
}

/** "Tuesday, November 10, 2026" */
export function formatLongDate(value: string): string {
  const d = parseDate(value);
  return d ? format(d, "EEEE, MMMM d, yyyy") : value;
}
