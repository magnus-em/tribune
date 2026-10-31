import type { CaseMessage } from "@/lib/types/database";
import type { Json } from "@/lib/types/supabase";
import { followUpOffer, type FollowUpInput } from "@/lib/letters/follow-up";
import { isDispatchPaused } from "@/lib/letters/approve-and-send";

/**
 * Follow-up notices: the daily cron tells a tenant, once per letter, that
 * Letter 2 or 3 is ready for their review. Pure and deterministic.
 *
 * A notice is an email to the tenant about their own case plus an in-app
 * system message. It never goes to the landlord, and it sends no letter: the
 * tenant still reads and approves the letter in the app (approve-and-send).
 *
 * Dedupe: the system message carries `dispatch_metadata.notice` and
 * `letter_number`. If one exists for Letter N, the tenant isn't notified again.
 *
 * Reminder: if Letter N is still waiting for approval
 * `FOLLOW_UP_REMINDER_AFTER_DAYS` days after the first notice, the tenant gets
 * one reminder (its own marker, `follow_up_reminder`). Never more than one.
 * Once the tenant approves, `current_letter_number` moves on and the offer for
 * Letter N is gone, so no reminder follows an approval.
 */

export const FOLLOW_UP_NOTICE_KIND = "follow_up_available";
export const FOLLOW_UP_REMINDER_KIND = "follow_up_reminder";

/** Calendar days between the "ready" notice and the single reminder. */
export const FOLLOW_UP_REMINDER_AFTER_DAYS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export type NoticeKind = "available" | "reminder";

export type NoticeMessage = Pick<CaseMessage, "message_type" | "created_at"> & {
  dispatch_metadata: Json | null;
};

export interface FollowUpNoticeInput {
  caseRow: FollowUpInput["caseRow"];
  messages: NoticeMessage[];
  actions: FollowUpInput["actions"];
  now?: Date;
}

export type FollowUpNoticeDecision =
  | { send: true; kind: NoticeKind; letterNumber: number; dueOn: Date }
  | { send: false; reason: "not_offered" | "already_notified" | "already_reminded" };

/** The metadata stored on the in-app message. Also the dedupe marker. */
export function followUpNoticeMetadata(
  letterNumber: number,
  notifiedAt: string,
  kind: NoticeKind = "available"
) {
  return {
    notice: kind === "reminder" ? FOLLOW_UP_REMINDER_KIND : FOLLOW_UP_NOTICE_KIND,
    letter_number: letterNumber,
    notified_at: notifiedAt,
  };
}

function markers(messages: NoticeMessage[], noticeKind: string, letterNumber: number) {
  return messages.filter((m) => {
    if (m.message_type !== "system") return false;
    const meta = m.dispatch_metadata;
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) return false;
    return meta.notice === noticeKind && meta.letter_number === letterNumber;
  });
}

export function alreadyNotified(messages: NoticeMessage[], letterNumber: number): boolean {
  return markers(messages, FOLLOW_UP_NOTICE_KIND, letterNumber).length > 0;
}

export function alreadyReminded(messages: NoticeMessage[], letterNumber: number): boolean {
  return markers(messages, FOLLOW_UP_REMINDER_KIND, letterNumber).length > 0;
}

/**
 * Whether this case's tenant should get a "Letter N is ready" notice now, or
 * the one reminder that Letter N is still waiting for their approval.
 */
export function followUpNoticeDecision(input: FollowUpNoticeInput): FollowUpNoticeDecision {
  const offer = followUpOffer(input);
  if (!offer.due) return { send: false, reason: "not_offered" };
  const n = offer.letterNumber;

  const notices = markers(input.messages, FOLLOW_UP_NOTICE_KIND, n);
  if (!notices.length) return { send: true, kind: "available", letterNumber: n, dueOn: offer.dueOn };
  if (alreadyReminded(input.messages, n)) return { send: false, reason: "already_reminded" };

  const firstNotice = Math.min(...notices.map((m) => new Date(m.created_at).getTime()));
  const now = (input.now ?? new Date()).getTime();
  if (!Number.isFinite(firstNotice) || now - firstNotice < FOLLOW_UP_REMINDER_AFTER_DAYS * DAY_MS) {
    return { send: false, reason: "already_notified" };
  }
  return { send: true, kind: "reminder", letterNumber: n, dueOn: offer.dueOn };
}

export interface NoticeCase {
  id: string;
  tenant_id: string;
  status: FollowUpInput["caseRow"]["status"];
  current_letter_number: number;
}

export interface PlannedNotice {
  caseId: string;
  tenantId: string;
  letterNumber: number;
  kind: NoticeKind;
}

export type NoticeRunPlan =
  | { paused: true; notices: [] }
  | { paused: false; notices: PlannedNotice[] };

/**
 * Plans one cron run across many cases. The kill switch stops every notice.
 * Messages and actions are grouped by case id by the caller's query results.
 */
export function planFollowUpNotices(args: {
  cases: NoticeCase[];
  messages: (NoticeMessage & { case_id: string })[];
  actions: (FollowUpInput["actions"][number] & { case_id: string })[];
  dispatchPaused: string | undefined;
  now?: Date;
}): NoticeRunPlan {
  if (isDispatchPaused(args.dispatchPaused)) return { paused: true, notices: [] };

  const notices: PlannedNotice[] = [];
  for (const c of args.cases) {
    const decision = followUpNoticeDecision({
      caseRow: { status: c.status, current_letter_number: c.current_letter_number },
      messages: args.messages.filter((m) => m.case_id === c.id),
      actions: args.actions.filter((a) => a.case_id === c.id),
      now: args.now,
    });
    if (decision.send) {
      notices.push({
        caseId: c.id,
        tenantId: c.tenant_id,
        letterNumber: decision.letterNumber,
        kind: decision.kind,
      });
    }
  }
  return { paused: false, notices };
}

/** Bearer-token check for the cron route. Fails closed when no secret is set. */
export function isAuthorizedCronRequest(
  authorizationHeader: string | null,
  cronSecret: string | undefined
): boolean {
  if (!cronSecret || cronSecret.trim() === "") return false;
  return authorizationHeader === `Bearer ${cronSecret}`;
}
