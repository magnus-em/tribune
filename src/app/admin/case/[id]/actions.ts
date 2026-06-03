"use server";

import { addDays, format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import { renderCaseUpdateEmail } from "@/lib/email/templates/case-update";
import { renderLandlordLetterEmail } from "@/lib/email/templates/landlord-letter";
import { renderInvoiceEmail } from "@/lib/email/templates/invoice";
import { revalidatePath } from "next/cache";
import type { CaseStatus } from "@/lib/types/database";
import { STATUS_LABELS } from "@/lib/types/database";
import { PAYMENT_DUE_DAYS } from "@/lib/constants";

export async function changeStatus(caseId: string, newStatus: CaseStatus, previousStatus: CaseStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("cases")
    .update({ status: newStatus })
    .eq("id", caseId);

  if (error) return { error: error.message };

  await supabase.from("case_messages").insert({
    case_id: caseId,
    message_type: "system",
    title: `Status changed to ${STATUS_LABELS[newStatus]}`,
    body: `Updated from "${STATUS_LABELS[previousStatus]}" to "${STATUS_LABELS[newStatus]}".`,
    created_by: user.id,
  });

  revalidatePath(`/admin/case/${caseId}`);
  revalidatePath(`/dashboard/case/${caseId}`);
  return { success: true };
}

export async function postNote(
  caseId: string,
  title: string,
  body: string,
  adminOnly: boolean
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("case_messages").insert({
    case_id: caseId,
    message_type: "tribune_update",
    title: title.trim(),
    body: body.trim(),
    is_admin_only: adminOnly,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/case/${caseId}`);
  revalidatePath(`/dashboard/case/${caseId}`);
  return { success: true };
}

export interface PostLetterParams {
  caseId: string;
  title: string;
  body: string;
  letterNumber: number;
}

export interface PostUpdateParams {
  caseId: string;
  title: string;
  body: string;
}

async function getCaseWithTenant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  caseId: string
) {
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("property_address, tenant_id, landlord_name, landlord_email, contingency_pct, amount_withheld_cents, deposit_amount_cents, statutory_deadline")
    .eq("id", caseId)
    .single();

  if (caseError || !caseRow) {
    console.error("[getCaseWithTenant] case query failed:", caseError);
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", caseRow.tenant_id)
    .single();

  if (profileError) {
    console.error("[getCaseWithTenant] profile query failed:", profileError);
  }

  return {
    property_address: caseRow.property_address,
    tenant_id: caseRow.tenant_id,
    tenant_name: profile?.full_name || "Tenant",
    tenant_email: profile?.email || null,
    landlord_name: caseRow.landlord_name,
    landlord_email: caseRow.landlord_email,
    contingency_pct: caseRow.contingency_pct,
    amount_withheld_cents: caseRow.amount_withheld_cents,
    deposit_amount_cents: caseRow.deposit_amount_cents,
    statutory_deadline: caseRow.statutory_deadline,
  };
}

// Stage a letter draft — sets status to correspondence_ready, does NOT send to landlord.
export async function postLetterWithNotification({
  caseId,
  title,
  body,
  letterNumber,
}: PostLetterParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const caseData = await getCaseWithTenant(supabase, caseId);
    if (!caseData) return { error: "Case not found" };

    const { error: insertError } = await supabase
      .from("case_messages")
      .insert({
        case_id: caseId,
        message_type: "tribune_letter",
        title: title.trim(),
        body: body.trim(),
        letter_number: letterNumber,
        created_by: user.id,
      });

    if (insertError) return { error: "Failed to save letter: " + insertError.message };

    const { error: updateError } = await supabase
      .from("cases")
      .update({ status: "correspondence_ready", current_letter_number: letterNumber })
      .eq("id", caseId);

    if (updateError) return { error: "Failed to update status: " + updateError.message };

    revalidatePath(`/admin/case/${caseId}`);
    revalidatePath(`/dashboard/case/${caseId}`);
    return { success: true };
  } catch (err) {
    return { error: "Something went wrong: " + String(err) };
  }
}

// Send a staged letter to the landlord via the specified channel.
export async function dispatchLetter(
  caseId: string,
  messageid: string,
  channel: "email"
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const caseData = await getCaseWithTenant(supabase, caseId);
    if (!caseData) return { error: "Case not found" };

    // Fetch the letter message
    const { data: msg } = await supabase
      .from("case_messages")
      .select("title, body, letter_number")
      .eq("id", messageid)
      .single();

    if (!msg) return { error: "Letter not found" };

    if (channel === "email") {
      if (!caseData.landlord_email) return { error: "No landlord email on file" };

      const html = renderLandlordLetterEmail({
        caseId,
        letterNumber: msg.letter_number ?? 1,
        letterBody: msg.body,
        tenantName: caseData.tenant_name,
        landlordName: caseData.landlord_name,
        propertyAddress: caseData.property_address,
      });

      const sentAt = new Date().toISOString();

      await sendEmail({
        to: caseData.landlord_email,
        subject: `${caseData.tenant_name} via Tribune — Security Deposit Demand Letter`,
        html,
        replyTo: `case+${caseId}@inbound.usetribune.org`,
      });

      // Record dispatch metadata on the message
      await supabase
        .from("case_messages")
        .update({
          dispatch_channel: "email",
          dispatch_metadata: { to: caseData.landlord_email, sent_at: sentAt },
        })
        .eq("id", messageid);

      // System timeline entry
      await supabase.from("case_messages").insert({
        case_id: caseId,
        message_type: "system",
        title: `Letter ${msg.letter_number ?? 1} sent to landlord via email`,
        body: `Sent to ${caseData.landlord_email} on ${format(new Date(sentAt), "MMMM d, yyyy 'at' h:mm a")}`,
        created_by: user.id,
      });

      // Log the dispatch action
      await supabase.from("case_actions").insert({
        case_id: caseId,
        action_type: "letter_dispatched",
        metadata: { letter_number: msg.letter_number, channel, sent_at: sentAt },
      });
    }

    // Advance status to awaiting_landlord
    await supabase
      .from("cases")
      .update({ status: "awaiting_landlord" })
      .eq("id", caseId);

    // Notify tenant
    if (caseData.tenant_email) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://usetribune.org";
        const html = renderCaseUpdateEmail({
          tenantName: caseData.tenant_name.split(" ")[0],
          caseId,
          messageTitle: `Letter ${msg.letter_number ?? 1} sent to your landlord`,
          messagePreview: `Tribune has sent Letter ${msg.letter_number ?? 1} to ${caseData.landlord_name} on your behalf. We'll notify you when they respond.`,
          siteUrl,
        });
        await sendEmail({
          to: caseData.tenant_email,
          subject: `Tribune sent a letter to your landlord — ${caseData.property_address}`,
          html,
        });
      } catch (emailErr) {
        console.error("[dispatchLetter] tenant notification failed:", emailErr);
      }
    }

    revalidatePath(`/admin/case/${caseId}`);
    revalidatePath(`/dashboard/case/${caseId}`);
    return { success: true };
  } catch (err) {
    return { error: "Something went wrong: " + String(err) };
  }
}

// Manually log a landlord reply (fallback when it arrives outside the inbound webhook).
export async function logLandlordReply(caseId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("case_messages").insert({
    case_id: caseId,
    message_type: "landlord_reply",
    title: "Landlord reply (manually logged)",
    body: body.trim(),
    created_by: user.id,
  });

  if (error) return { error: error.message };

  await supabase.from("cases").update({ status: "landlord_responded" }).eq("id", caseId);

  revalidatePath(`/admin/case/${caseId}`);
  revalidatePath(`/dashboard/case/${caseId}`);
  return { success: true };
}

export async function markInvoicePaid(
  invoiceId: string,
  paymentMethod: "venmo" | "zelle" | "stripe" | "waived",
  paymentReference: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("invoices")
    .update({
      status: paymentMethod === "waived" ? "waived" : "paid",
      paid_at: new Date().toISOString(),
      payment_method: paymentMethod,
      payment_reference: paymentReference || null,
    })
    .eq("id", invoiceId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function postUpdateWithNotification({
  caseId,
  title,
  body,
}: PostUpdateParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const caseData = await getCaseWithTenant(supabase, caseId);
    if (!caseData) return { error: "Case not found" };

    const { error: insertError } = await supabase
      .from("case_messages")
      .insert({
        case_id: caseId,
        message_type: "tribune_update",
        title: title.trim(),
        body: body.trim(),
        created_by: user.id,
      });

    if (insertError) return { error: "Failed to save update: " + insertError.message };

    if (caseData.tenant_email) {
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://usetribune.org";
        const emailHtml = renderCaseUpdateEmail({
          tenantName: caseData.tenant_name.split(" ")[0],
          caseId,
          messageTitle: title,
          messagePreview: body.substring(0, 200) + (body.length > 200 ? "..." : ""),
          siteUrl,
        });
        await sendEmail({
          to: caseData.tenant_email,
          subject: `Case Update — ${caseData.property_address}`,
          html: emailHtml,
        });
      } catch (emailErr) {
        console.error("[postUpdate] email failed:", emailErr);
      }
    }

    revalidatePath(`/admin/case/${caseId}`);
    revalidatePath(`/dashboard/case/${caseId}`);
    return { success: true };
  } catch (err) {
    return { error: "Something went wrong: " + String(err) };
  }
}

// Admin-side recovery reporting (mirrors tenant version but runs under admin session).
export async function adminReportRecovery(
  caseId: string,
  amountRecoveredCents: number,
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const caseData = await getCaseWithTenant(supabase, caseId);
  if (!caseData) return { error: "Case not found" };

  const originalReturnedCents = caseData.deposit_amount_cents - caseData.amount_withheld_cents;
  const newReturnedCents = originalReturnedCents + amountRecoveredCents;

  const { error: updateError } = await supabase
    .from("cases")
    .update({ deposit_returned_cents: newReturnedCents, status: "resolved" })
    .eq("id", caseId);

  if (updateError) return { error: updateError.message };

  await supabase.from("case_actions").insert({
    case_id: caseId,
    action_type: "resolution_reported",
    metadata: { amount_recovered_cents: amountRecoveredCents, notes: notes || null, reported_at: new Date().toISOString(), reported_by: "admin" },
  });

  const contingencyPct: number = caseData.contingency_pct ?? 15;
  const feeCents = Math.round(amountRecoveredCents * contingencyPct / 100);
  const dueDate = addDays(new Date(), PAYMENT_DUE_DAYS);
  const dueDateIso = format(dueDate, "yyyy-MM-dd");

  const { data: invoiceNumberRow } = await supabase.rpc("next_invoice_number");
  const invoiceNumber: string = invoiceNumberRow ?? `TRB-${new Date().getFullYear()}-XXXX`;

  await supabase.from("invoices").insert({
    case_id: caseId,
    invoice_number: invoiceNumber,
    amount_cents: feeCents,
    status: "pending",
    due_date: dueDateIso,
  });

  if (caseData.tenant_email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://usetribune.org";
    const paymentPhone = process.env.NEXT_PUBLIC_TRIBUNE_PAYMENT_PHONE ?? "";
    const html = renderInvoiceEmail({
      tenantName: caseData.tenant_name,
      invoiceNumber,
      amountDollars: `$${(feeCents / 100).toFixed(2)}`,
      dueDate: format(dueDate, "MMMM d, yyyy"),
      caseId,
      propertyAddress: caseData.property_address ?? "",
      recoveredDollars: `$${(amountRecoveredCents / 100).toFixed(2)}`,
      contingencyPct,
      paymentPhone,
      siteUrl,
    });
    await sendEmail({
      to: caseData.tenant_email,
      subject: `Invoice ${invoiceNumber} — Tribune service fee`,
      html,
    });
  }

  revalidatePath(`/admin/case/${caseId}`);
  revalidatePath(`/dashboard/case/${caseId}`);
  return { success: true };
}
