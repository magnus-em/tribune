import { differenceInCalendarDays, startOfDay } from "date-fns";
import type { Case, CaseMessage, MessageType } from "@/lib/types/database";
import { isTerminalStatus, parseDateOnly } from "@/lib/utils/case";

/**
 * Admin exception queue — a pure, read-only sort of cases into the buckets
 * that need a human (or a future cron) to look at them.
 *
 * Display only. Nothing here writes, sends, or changes a case.
 *
 * The deadline bucket uses the stored `statutory_deadline`, which ignores the
 * forwarding-address branch of § 47a-21 (BACKLOG: forwarding-address date), so
 * the real deadline can be later than the one shown.
 */

export type ExceptionKind =
  | "new_intake"
  | "landlord_reply"
  | "deadline_soon"
  | "invoice_overdue";

export const EXCEPTION_LABELS: Record<ExceptionKind, string> = {
  new_intake: "New intakes",
  landlord_reply: "Landlord replies with no follow-up",
  deadline_soon: "Statutory deadline within 3 days",
  invoice_overdue: "Overdue invoices",
};

export const DEADLINE_WINDOW_DAYS = 3;

export type ExceptionCase = Pick<
  Case,
  "id" | "status" | "statutory_deadline" | "created_at"
>;

export type ExceptionMessage = Pick<
  CaseMessage,
  "case_id" | "message_type" | "created_at"
>;

export interface ExceptionInvoice {
  case_id: string;
  status: string;
  due_date: string;
}

export interface ExceptionItem {
  case_id: string;
  kind: ExceptionKind;
  detail: string;
}

export type ExceptionQueue = Record<ExceptionKind, ExceptionItem[]>;

// Messages that count as Tribune following up on a landlord reply.
const FOLLOW_UP_TYPES: ReadonlySet<MessageType> = new Set([
  "tribune_letter",
  "tribune_update",
]);

// Invoice states that are settled and never overdue.
const SETTLED_INVOICE: ReadonlySet<string> = new Set(["paid", "waived"]);

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function buildExceptionQueue(
  cases: ExceptionCase[],
  messages: ExceptionMessage[],
  invoices: ExceptionInvoice[],
  today: Date = new Date()
): ExceptionQueue {
  const day = startOfDay(today);
  const queue: ExceptionQueue = {
    new_intake: [],
    landlord_reply: [],
    deadline_soon: [],
    invoice_overdue: [],
  };

  const lastReply = new Map<string, number>();
  const lastFollowUp = new Map<string, number>();
  for (const m of messages) {
    const t = new Date(m.created_at).getTime();
    if (Number.isNaN(t)) continue;
    const target =
      m.message_type === "landlord_reply"
        ? lastReply
        : FOLLOW_UP_TYPES.has(m.message_type)
          ? lastFollowUp
          : null;
    if (target && t > (target.get(m.case_id) ?? -Infinity)) {
      target.set(m.case_id, t);
    }
  }

  for (const c of cases) {
    if (c.status === "intake_submitted") {
      const age = differenceInCalendarDays(day, new Date(c.created_at));
      queue.new_intake.push({
        case_id: c.id,
        kind: "new_intake",
        detail: age <= 0 ? "Submitted today" : `Submitted ${plural(age, "day")} ago`,
      });
    }

    if (isTerminalStatus(c.status)) continue;

    const reply = lastReply.get(c.id);
    const followUp = lastFollowUp.get(c.id) ?? -Infinity;
    if (reply !== undefined && reply > followUp) {
      const age = differenceInCalendarDays(day, new Date(reply));
      queue.landlord_reply.push({
        case_id: c.id,
        kind: "landlord_reply",
        detail:
          age <= 0
            ? "Landlord replied today"
            : `Landlord replied ${plural(age, "day")} ago`,
      });
    } else if (c.status === "landlord_responded") {
      queue.landlord_reply.push({
        case_id: c.id,
        kind: "landlord_reply",
        detail: "Status is Landlord Responded",
      });
    }

    const daysLeft = differenceInCalendarDays(
      parseDateOnly(c.statutory_deadline),
      day
    );
    if (daysLeft >= 0 && daysLeft <= DEADLINE_WINDOW_DAYS) {
      queue.deadline_soon.push({
        case_id: c.id,
        kind: "deadline_soon",
        detail:
          daysLeft === 0
            ? "Stored deadline is today"
            : `Stored deadline in ${plural(daysLeft, "day")}`,
      });
    }
  }

  for (const inv of invoices) {
    if (SETTLED_INVOICE.has(inv.status)) continue;
    const daysLate = differenceInCalendarDays(day, parseDateOnly(inv.due_date));
    if (inv.status === "overdue" || inv.status === "collections" || daysLate > 0) {
      queue.invoice_overdue.push({
        case_id: inv.case_id,
        kind: "invoice_overdue",
        detail:
          inv.status === "collections"
            ? "In collections"
            : daysLate > 0
              ? `${plural(daysLate, "day")} past due`
              : "Marked overdue",
      });
    }
  }

  return queue;
}

export function exceptionCount(queue: ExceptionQueue): number {
  return Object.values(queue).reduce((n, items) => n + items.length, 0);
}
