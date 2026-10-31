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
 */

export const FOLLOW_UP_NOTICE_KIND = "follow_up_available";

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
  | { send: true; letterNumber: number; dueOn: Date }
  | { send: false; reason: "not_offered" | "already_notified" };

/** The metadata stored on the in-app message. Also the dedupe marker. */
export function followUpNoticeMetadata(letterNumber: number, notifiedAt: string) {
  return { notice: FOLLOW_UP_NOTICE_KIND, letter_number: letterNumber, notified_at: notifiedAt };
}

export function alreadyNotified(messages: NoticeMessage[], letterNumber: number): boolean {
  return messages.some((m) => {
    if (m.message_type !== "system") return false;
    const meta = m.dispatch_metadata;
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) return false;
    return meta.notice === FOLLOW_UP_NOTICE_KIND && meta.letter_number === letterNumber;
  });
}

/** Whether this case's tenant should get a "Letter N is ready" notice now. */
export function followUpNoticeDecision(input: FollowUpNoticeInput): FollowUpNoticeDecision {
  const offer = followUpOffer(input);
  if (!offer.due) return { send: false, reason: "not_offered" };
  if (alreadyNotified(input.messages, offer.letterNumber)) {
    return { send: false, reason: "already_notified" };
  }
  return { send: true, letterNumber: offer.letterNumber, dueOn: offer.dueOn };
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
      notices.push({ caseId: c.id, tenantId: c.tenant_id, letterNumber: decision.letterNumber });
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
