import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";

// Resend inbound email webhook.
//
// Flow (per Resend docs):
//  1. Landlord replies to case+{caseId}@inbound.usetribune.org (our reply-to).
//  2. Resend POSTs an `email.received` event here — METADATA ONLY (no body).
//  3. We fetch the full body via resend.emails.receiving.get(email_id).
//  4. We log it as a landlord_reply, flip status, and notify the admin.
//
// This route runs with NO user session, so it writes via the service-role
// client (bypasses RLS). It is a deliberately narrow admin job: it only ever
// inserts a landlord_reply message and moves status to landlord_responded.

const CASE_ID_RE = /case\+([0-9a-f-]{36})@/i;

function extractCaseId(to: unknown): string | null {
  const addrs: string[] = Array.isArray(to)
    ? to.map(String)
    : typeof to === "string"
      ? [to]
      : [];
  for (const addr of addrs) {
    const m = addr.match(CASE_ID_RE);
    if (m) return m[1];
  }
  return null;
}

interface ReceivedEvent {
  type: string;
  data: {
    email_id: string;
    from?: string;
    to?: string[] | string;
    subject?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 1. Verify signature when configured; otherwise parse directly (local/dev).
    let event: ReceivedEvent;
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (secret) {
      try {
        event = resend.webhooks.verify({
          payload: raw,
          headers: {
            id: request.headers.get("svix-id") ?? "",
            timestamp: request.headers.get("svix-timestamp") ?? "",
            signature: request.headers.get("svix-signature") ?? "",
          },
          webhookSecret: secret,
        }) as unknown as ReceivedEvent;
      } catch (err) {
        console.error("[inbound] signature verification failed:", err);
        return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
      }
    } else {
      event = JSON.parse(raw) as ReceivedEvent;
    }

    // 2. Only handle inbound receipts.
    if (event.type !== "email.received") {
      return NextResponse.json({ ok: true, skipped: `unhandled_type:${event.type}` });
    }

    const caseId = extractCaseId(event.data.to);
    if (!caseId) {
      console.warn("[inbound] no caseId in To:", event.data.to);
      return NextResponse.json({ ok: true, skipped: "no_case_id" });
    }

    const supabase = createServiceClient();

    // 3. Verify the case exists.
    const { data: caseRow } = await supabase
      .from("cases")
      .select("id, status, property_address")
      .eq("id", caseId)
      .single();

    if (!caseRow) {
      console.warn("[inbound] case not found:", caseId);
      return NextResponse.json({ ok: true, skipped: "case_not_found" });
    }

    // 4. Fetch the full email body (webhook payload has metadata only).
    let replyBody = "(body unavailable)";
    try {
      const { data: email } = await resend.emails.receiving.get(event.data.email_id);
      if (email) {
        replyBody = email.text?.trim() || email.html?.trim() || replyBody;
      }
    } catch (err) {
      console.error("[inbound] failed to fetch email body:", err);
    }

    const subject = event.data.subject || "Landlord reply";
    const fromAddress = event.data.from || "unknown sender";

    // 5. Log the reply. created_by is NOT NULL, so attribute it to an admin
    //    profile (the message represents a landlord reply, surfaced to admin).
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_admin", true)
      .limit(1)
      .single();

    if (!adminProfile) {
      console.error("[inbound] no admin profile to attribute reply to");
      return NextResponse.json({ ok: false, error: "no_admin" }, { status: 500 });
    }

    await supabase.from("case_messages").insert({
      case_id: caseId,
      message_type: "landlord_reply",
      title: subject,
      body: `From: ${fromAddress}\n\n${replyBody}`,
      created_by: adminProfile.id,
    });

    // 6. Advance status unless the case is already terminal.
    const isTerminal = caseRow.status === "resolved" || caseRow.status === "closed";
    if (!isTerminal) {
      await supabase
        .from("cases")
        .update({ status: "landlord_responded" })
        .eq("id", caseId);
    }

    // 7. Notify the admin so they can craft a response.
    const adminEmail = process.env.ADMIN_EMAIL || "hello@usetribune.org";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://usetribune.org";
    await sendEmail({
      to: adminEmail,
      subject: `Landlord replied — ${caseRow.property_address}`,
      html: `
        <p>A landlord replied for case <strong>${caseId}</strong> (${caseRow.property_address}).</p>
        <p><strong>From:</strong> ${fromAddress}<br/><strong>Subject:</strong> ${subject}</p>
        <pre style="font-family:monospace;white-space:pre-wrap;background:#f6f5f1;padding:12px;border-radius:6px">${replyBody}</pre>
        <p><a href="${siteUrl}/admin/case/${caseId}">Open in admin →</a></p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[inbound] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
