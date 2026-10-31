import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import {
  followUpAvailableMessage,
  followUpAvailableSubject,
  renderFollowUpAvailableEmail,
} from "@/lib/email/templates/follow-up-available";
import {
  followUpNoticeMetadata,
  isAuthorizedCronRequest,
  planFollowUpNotices,
} from "@/lib/letters/follow-up-notice";

export const dynamic = "force-dynamic";

/**
 * Daily cron (vercel.json): emails each tenant once when Letter 2 or 3 becomes
 * available on their case, and once more if it is still waiting for their
 * approval a few days later. Transactional, about the tenant's own case.
 *
 * Never contacts a landlord and sends no letter. The letter still goes out only
 * after the tenant approves it in the app. `DISPATCH_PAUSED=true` stops it.
 *
 * Scoped service-role use: there is no user session in a cron, and the job must
 * read every awaiting case. It writes only the tenant-visible notice message.
 * Logs carry counts and case ids only, never names, emails, or amounts.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let supabase: ReturnType<typeof createServiceClient>;
  try {
    supabase = createServiceClient();
  } catch (err) {
    console.error("[cron/follow-up-notices] service client unavailable:", err);
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const { data: cases, error: casesError } = await supabase
    .from("cases")
    .select("id, tenant_id, status, current_letter_number")
    .eq("status", "awaiting_landlord")
    .in("current_letter_number", [1, 2]);
  if (casesError) {
    console.error("[cron/follow-up-notices] cases query failed:", casesError.message);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }
  if (!cases?.length) return NextResponse.json({ ok: true, considered: 0, notified: 0 });

  const caseIds = cases.map((c) => c.id);
  const [{ data: messages, error: mErr }, { data: actions, error: aErr }] = await Promise.all([
    supabase
      .from("case_messages")
      .select("case_id, message_type, dispatch_metadata, created_at")
      .in("case_id", caseIds),
    supabase.from("case_actions").select("case_id, action_type, metadata, created_at").in("case_id", caseIds),
  ]);
  if (mErr || aErr) {
    console.error("[cron/follow-up-notices] history query failed");
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }

  const now = new Date();
  const plan = planFollowUpNotices({
    cases,
    messages: messages ?? [],
    actions: actions ?? [],
    dispatchPaused: process.env.DISPATCH_PAUSED,
    now,
  });
  if (plan.paused) {
    return NextResponse.json({ ok: true, paused: true, considered: cases.length, notified: 0 });
  }
  if (!plan.notices.length) {
    return NextResponse.json({ ok: true, considered: cases.length, notified: 0 });
  }

  // created_by is NOT NULL; system messages without a user are attributed to an
  // admin profile, as the inbound webhook does. The tenant sees "Tribune".
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();
  if (!adminProfile) {
    console.error("[cron/follow-up-notices] no admin profile to attribute notices to");
    return NextResponse.json({ ok: false, error: "no_admin" }, { status: 500 });
  }

  const tenantIds = [...new Set(plan.notices.map((n) => n.tenantId))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", tenantIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://usetribune.org";
  let notified = 0;
  let failed = 0;

  for (const notice of plan.notices) {
    const profile = profileById.get(notice.tenantId);
    if (!profile?.email) {
      failed++;
      continue;
    }

    // The in-app message is written first: it is the dedupe marker, so a crash
    // after the email can't lead to a second email tomorrow.
    const message = followUpAvailableMessage(notice.letterNumber, now, notice.kind);
    const { data: inserted, error: insertError } = await supabase
      .from("case_messages")
      .insert({
        case_id: notice.caseId,
        message_type: "system",
        title: message.title,
        body: message.body,
        created_by: adminProfile.id,
        dispatch_metadata: followUpNoticeMetadata(notice.letterNumber, now.toISOString(), notice.kind),
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      console.error("[cron/follow-up-notices] notice insert failed for case", notice.caseId);
      failed++;
      continue;
    }

    const sent = await sendEmail({
      to: profile.email,
      subject: followUpAvailableSubject(notice.letterNumber, notice.kind),
      html: renderFollowUpAvailableEmail({
        tenantName: profile.full_name ?? "",
        caseId: notice.caseId,
        letterNumber: notice.letterNumber,
        siteUrl,
        kind: notice.kind,
      }),
    });

    // A skipped send (no RESEND_API_KEY) delivered nothing, so it isn't a notice.
    if ("error" in sent || ("skipped" in sent && sent.skipped)) {
      // Retry tomorrow: remove the marker so the notice is planned again.
      await supabase.from("case_messages").delete().eq("id", inserted.id);
      console.error("[cron/follow-up-notices] email failed for case", notice.caseId);
      failed++;
      continue;
    }
    notified++;
  }

  const reminders = plan.notices.filter((n) => n.kind === "reminder").length;
  return NextResponse.json({ ok: true, considered: cases.length, notified, failed, reminders_planned: reminders });
}
