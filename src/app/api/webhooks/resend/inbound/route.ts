import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";

// Resend inbound email webhook.
// Landlord reply-to addresses are encoded as: case+{caseId}@inbound.usetribune.org
// Resend delivers inbound emails as JSON POST to this route.

function extractCaseId(toAddresses: string[]): string | null {
  for (const addr of toAddresses) {
    const match = addr.match(/case\+([a-f0-9-]{36})@/i);
    if (match) return match[1];
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Resend inbound payload shape: { from, to, subject, text, html, ... }
    const toAddresses: string[] = Array.isArray(payload.to)
      ? payload.to
      : typeof payload.to === "string"
        ? [payload.to]
        : [];

    const caseId = extractCaseId(toAddresses);
    if (!caseId) {
      console.warn("[inbound] could not extract caseId from To:", toAddresses);
      return NextResponse.json({ ok: true, skipped: "no_case_id" });
    }

    const supabase = await createClient();

    // Verify the case exists
    const { data: caseRow } = await supabase
      .from("cases")
      .select("id, status, property_address")
      .eq("id", caseId)
      .single();

    if (!caseRow) {
      console.warn("[inbound] case not found:", caseId);
      return NextResponse.json({ ok: true, skipped: "case_not_found" });
    }

    // Don't change status if already terminal
    const isTerminal = caseRow.status === "resolved" || caseRow.status === "closed";

    const replyBody = payload.text || payload.html || "(no body)";
    const subject = payload.subject || "Landlord reply";
    const fromAddress = payload.from || "unknown";

    // Log the reply as a case message (service role write via server client)
    // Using a system user — we don't have a user context here
    // Admin user id lookup workaround: insert without created_by constraint via service role
    // For now, use a placeholder admin-created_by workaround via the first admin profile
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_admin", true)
      .limit(1)
      .single();

    if (!adminProfile) {
      console.error("[inbound] no admin profile found to attribute message to");
      return NextResponse.json({ ok: false, error: "no_admin" }, { status: 500 });
    }

    await supabase.from("case_messages").insert({
      case_id: caseId,
      message_type: "landlord_reply",
      title: subject,
      body: `From: ${fromAddress}\n\n${replyBody}`,
      created_by: adminProfile.id,
    });

    // Update status unless terminal
    if (!isTerminal) {
      await supabase
        .from("cases")
        .update({ status: "landlord_responded" })
        .eq("id", caseId);
    }

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL || "hello@usetribune.org";
    await sendEmail({
      to: adminEmail,
      subject: `Landlord replied — ${caseRow.property_address}`,
      html: `<p>A landlord has replied to Tribune for case <strong>${caseId}</strong> (${caseRow.property_address}).</p><p>From: ${fromAddress}</p><p>Subject: ${subject}</p><pre style="font-family:monospace;white-space:pre-wrap">${replyBody}</pre>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[inbound] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
