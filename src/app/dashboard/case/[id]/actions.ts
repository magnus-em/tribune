"use server";

import { addDays, format } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { MAX_FILE_SIZE_BYTES, ALLOWED_FILE_TYPES, PAYMENT_DUE_DAYS, INTRO_SENT_TITLE } from "@/lib/constants";
import { sendEmail } from "@/lib/email/client";
import { renderInvoiceEmail } from "@/lib/email/templates/invoice";
import { renderCaseUpdateEmail } from "@/lib/email/templates/case-update";
import { renderLandlordLetterEmail } from "@/lib/email/templates/landlord-letter";
import {
  APPROVAL_STATEMENT,
  parseContactDetail,
  prepareLetterDispatch,
  type ContactDetailField,
  type DispatchInput,
  type DispatchPlan,
} from "@/lib/letters/approve-and-send";

export async function uploadDocument(
  caseId: string,
  formData: FormData
) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify user owns this case
  const { data: caseData } = await supabase
    .from("cases")
    .select("tenant_id")
    .eq("id", caseId)
    .single();

  if (!caseData || caseData.tenant_id !== user.id) {
    return { error: "Not authorized to upload to this case" };
  }

  const file = formData.get("file") as File;
  const kind = formData.get("kind") as string;

  if (!file || !kind) {
    return { error: "File and document kind are required" };
  }

  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) {
    return { error: "File type not allowed. Please upload PDF, JPG, PNG, or DOC/DOCX files." };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: `File size must be less than ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB` };
  }

  try {
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const storagePath = `case_documents/${caseId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("case-documents")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: "Failed to upload file", details: uploadError.message };
    }

    // Insert metadata into case_documents table
    const { error: dbError } = await supabase.from("case_documents").insert({
      case_id: caseId,
      kind,
      storage_path: storagePath,
      original_filename: file.name,
      content_type: file.type,
      size_bytes: file.size,
      uploaded_by: user.id,
    });

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("case-documents").remove([storagePath]);
      return { error: "Failed to save document metadata", details: dbError.message };
    }

    // Add system message to case timeline
    await supabase.from("case_messages").insert({
      case_id: caseId,
      message_type: "system",
      title: `Document uploaded: ${kind.replace(/_/g, " ")}`,
      body: `Tenant uploaded ${file.name}`,
      created_by: user.id,
    });

    return { success: true, fileName: file.name };
  } catch (err) {
    return { error: "An unexpected error occurred", details: String(err) };
  }
}

export async function reportRecovery(
  caseId: string,
  amountRecoveredCents: number,
  notes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: caseRow } = await supabase
    .from("cases")
    .select("tenant_id, deposit_amount_cents, amount_withheld_cents, contingency_pct, property_address")
    .eq("id", caseId)
    .single();

  if (!caseRow || caseRow.tenant_id !== user.id) return { error: "Not authorized" };

  // Validate the reported amount: must be positive and cannot exceed what was
  // withheld (you can't recover more than the landlord kept).
  if (
    !Number.isFinite(amountRecoveredCents) ||
    amountRecoveredCents <= 0 ||
    amountRecoveredCents > caseRow.amount_withheld_cents
  ) {
    return { error: "Enter a valid recovery amount (up to the amount withheld)." };
  }

  // Guard against double-reporting (double-click, or tenant + admin both filing)
  // creating a second invoice for the same case.
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("case_id", caseId)
    .limit(1)
    .maybeSingle();
  if (existingInvoice) {
    return { error: "A recovery has already been recorded for this case." };
  }

  // deposit_returned_cents = original return + newly recovered
  const originalReturnedCents =
    caseRow.deposit_amount_cents - caseRow.amount_withheld_cents;
  const newReturnedCents = originalReturnedCents + amountRecoveredCents;

  const { error: updateError } = await supabase
    .from("cases")
    .update({ deposit_returned_cents: newReturnedCents, status: "resolved" })
    .eq("id", caseId);

  if (updateError) return { error: updateError.message };

  await supabase.from("case_actions").insert({
    case_id: caseId,
    action_type: "resolution_reported",
    metadata: {
      amount_recovered_cents: amountRecoveredCents,
      notes: notes || null,
      reported_at: new Date().toISOString(),
    },
  });

  // ── Invoice ────────────────────────────────────────────────────────────────
  const contingencyPct: number = caseRow.contingency_pct ?? 15;
  const feeCents = Math.round(amountRecoveredCents * contingencyPct / 100);
  const dueDate = addDays(new Date(), PAYMENT_DUE_DAYS);
  const dueDateIso = format(dueDate, "yyyy-MM-dd");

  const { data: invoiceNumberRow } = await supabase.rpc("next_invoice_number");
  const invoiceNumber: string = invoiceNumberRow ?? `TRB-${new Date().getFullYear()}-XXXX`;

  const { error: invoiceError } = await supabase.from("invoices").insert({
    case_id: caseId,
    invoice_number: invoiceNumber,
    amount_cents: feeCents,
    status: "pending",
    due_date: dueDateIso,
  });

  if (invoiceError) {
    console.error("[reportRecovery] Failed to create invoice:", invoiceError);
    // Don't block resolution — case is already marked resolved
  }

  // ── Invoice email ──────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://usetribune.org";
    const paymentPhone = process.env.NEXT_PUBLIC_TRIBUNE_PAYMENT_PHONE ?? "";

    const html = renderInvoiceEmail({
      tenantName: profile.full_name ?? "there",
      invoiceNumber,
      amountDollars: `$${(feeCents / 100).toFixed(2)}`,
      dueDate: format(dueDate, "MMMM d, yyyy"),
      caseId,
      propertyAddress: caseRow.property_address ?? "",
      recoveredDollars: `$${(amountRecoveredCents / 100).toFixed(2)}`,
      contingencyPct,
      paymentPhone,
      siteUrl,
    });

    await sendEmail({
      to: profile.email,
      subject: `Invoice ${invoiceNumber} — Tribune service fee`,
      html,
    });
  }

  return { success: true };
}

// Tenant confirms they sent the introductory email to their landlord.
// Logged as a system message so it appears in the timeline and the admin can
// see the agency hand-off happened before Tribune sends the first letter.
export async function markLandlordIntroSent(caseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: caseRow } = await supabase
    .from("cases")
    .select("tenant_id")
    .eq("id", caseId)
    .single();
  if (!caseRow || caseRow.tenant_id !== user.id) return { error: "Not authorized" };

  const { error } = await supabase.from("case_messages").insert({
    case_id: caseId,
    message_type: "system",
    title: INTRO_SENT_TITLE,
    body: "Tenant confirmed they emailed their landlord to introduce Tribune as their authorized representative.",
    created_by: user.id,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function getDocumentUrl(storagePath: string) {
  const supabase = await createClient();

  // Generate signed URL (valid for 1 hour)
  const { data, error } = await supabase.storage
    .from("case-documents")
    .createSignedUrl(storagePath, 3600);

  if (error || !data) {
    return { error: "Failed to generate download URL" };
  }

  return { url: data.signedUrl };
}

// ── Tenant approve-and-send ──────────────────────────────────────────────────
// The tenant reads Letter N, ticks the approval box, and Tribune sends it to the
// landlord in the tenant's name. Rules and letter text live in
// src/lib/letters/approve-and-send.ts; these actions only load and write.

type SessionClient = Awaited<ReturnType<typeof createClient>>;

// Everything the rules need, read under the tenant's session. RLS proves the
// tenant can see the case; the tenant_id check proves it's theirs (an admin
// session can read every case but must not approve on a tenant's behalf).
async function loadDispatchInput(
  supabase: SessionClient,
  caseId: string,
  userId: string,
  letterNumber: number
): Promise<{ input: DispatchInput; landlordEmail: string; tenantEmail: string } | null> {
  const [{ data: caseRow }, { data: profile }, { data: messages }, { data: actions }, { data: lease }] =
    await Promise.all([
      supabase.from("cases").select("*").eq("id", caseId).single(),
      supabase.from("profiles").select("full_name, email, phone").eq("id", userId).single(),
      supabase.from("case_messages").select("message_type, dispatch_metadata, created_at").eq("case_id", caseId),
      supabase.from("case_actions").select("action_type, metadata, created_at").eq("case_id", caseId),
      supabase.from("case_documents").select("id").eq("case_id", caseId).eq("kind", "lease").limit(1).maybeSingle(),
    ]);

  if (!caseRow || caseRow.tenant_id !== userId || !profile) return null;

  return {
    input: {
      caseRow,
      profile,
      messages: messages ?? [],
      actions: actions ?? [],
      hasLease: !!lease,
      letterNumber,
      dispatchPaused: process.env.DISPATCH_PAUSED,
    },
    landlordEmail: caseRow.landlord_email ?? "",
    tenantEmail: profile.email,
  };
}

// Read-only preview: the exact letter that Approve & send would send, or why it can't.
export async function getLetterForApproval(
  caseId: string,
  letterNumber: number
): Promise<DispatchPlan | { ok: false; reason: "not_authorized"; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "not_authorized", message: "Not authenticated" };

  const loaded = await loadDispatchInput(supabase, caseId, user.id, letterNumber);
  if (!loaded) return { ok: false, reason: "not_authorized", message: "Not authorized" };
  return prepareLetterDispatch(loaded.input);
}

// Takes no letter text: the letter is regenerated here from the case row.
export async function approveAndSendLetter(caseId: string, letterNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const loaded = await loadDispatchInput(supabase, caseId, user.id, letterNumber);
  if (!loaded) return { error: "Not authorized" };

  const plan = prepareLetterDispatch(loaded.input);
  if (!plan.ok) return { error: plan.message };

  const { input, landlordEmail, tenantEmail } = loaded;
  const approvedAt = new Date().toISOString();

  // Scoped privileged writes. Tenants can't insert tribune_letter messages under
  // RLS, so this one function uses the service role, after the session checks above.
  let admin: ReturnType<typeof createServiceClient>;
  try {
    admin = createServiceClient();
  } catch (err) {
    console.error("[approveAndSendLetter] service client unavailable:", err);
    return { error: "Tribune can't send letters right now. Try again later." };
  }

  // Claim the letter number first. The conditional update is the lock: a double
  // click or a second tab finds current_letter_number already advanced.
  const { data: claimed, error: claimError } = await admin
    .from("cases")
    .update({ current_letter_number: letterNumber })
    .eq("id", caseId)
    .eq("current_letter_number", letterNumber - 1)
    .eq("status", input.caseRow.status)
    .select("id");
  if (claimError || !claimed?.length) {
    return { error: "This letter has already been sent or the case changed. Refresh the page." };
  }

  const { data: letterMsg, error: letterError } = await admin
    .from("case_messages")
    .insert({
      case_id: caseId,
      message_type: "tribune_letter",
      title: plan.title,
      body: plan.body,
      letter_number: letterNumber,
      created_by: user.id,
    })
    .select("id")
    .single();

  const release = async () => {
    if (letterMsg) await admin.from("case_messages").delete().eq("id", letterMsg.id);
    await admin
      .from("cases")
      .update({ current_letter_number: letterNumber - 1 })
      .eq("id", caseId)
      .eq("current_letter_number", letterNumber);
  };

  if (letterError || !letterMsg) {
    await release();
    return { error: "Tribune couldn't save the letter. Nothing was sent." };
  }

  const tenantName = input.profile.full_name;
  const sent = await sendEmail({
    to: landlordEmail,
    subject: `${tenantName} via Tribune — Security Deposit Demand Letter`,
    html: renderLandlordLetterEmail({
      caseId,
      letterNumber,
      letterBody: plan.body,
      tenantName,
      landlordName: input.caseRow.landlord_name,
      propertyAddress: input.caseRow.property_address,
    }),
    // Landlord replies route back to this case through the inbound webhook.
    replyTo: `case+${caseId}@reply.usetribune.org`,
  });

  // A skipped send (no RESEND_API_KEY) delivered nothing, so it isn't a dispatch.
  if ("error" in sent || ("skipped" in sent && sent.skipped)) {
    await release();
    return { error: "Tribune couldn't send the letter. Nothing was sent; try again later." };
  }

  const sentAt = new Date().toISOString();
  await admin
    .from("case_messages")
    .update({
      dispatch_channel: "email",
      dispatch_metadata: {
        to: landlordEmail,
        sent_at: sentAt,
        email_id: "id" in sent ? sent.id ?? null : null,
        approved_by_tenant: true,
        approved_at: approvedAt,
      },
    })
    .eq("id", letterMsg.id);

  await admin.from("cases").update({ status: "awaiting_landlord" }).eq("id", caseId);

  await admin.from("case_actions").insert({
    case_id: caseId,
    action_type: "letter_dispatched",
    metadata: {
      letter_number: letterNumber,
      channel: "email",
      sent_at: sentAt,
      approved_by: "tenant",
      approved_by_user_id: user.id,
      approved_at: approvedAt,
      approval_statement: APPROVAL_STATEMENT,
    },
  });

  await admin.from("case_messages").insert({
    case_id: caseId,
    message_type: "system",
    title: `You approved Letter ${letterNumber}; Tribune sent it`,
    body: `Tribune emailed Letter ${letterNumber} to your landlord on ${format(new Date(sentAt), "MMMM d, yyyy 'at' h:mm a")}. Replies come to Tribune and appear here.`,
    created_by: user.id,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://usetribune.org";

  // Tenant confirmation and the operator FYI are best-effort: the letter is sent.
  try {
    await sendEmail({
      to: tenantEmail,
      subject: `Tribune sent Letter ${letterNumber} to your landlord — ${input.caseRow.property_address}`,
      html: renderCaseUpdateEmail({
        tenantName: tenantName.split(" ")[0],
        caseId,
        messageTitle: `Letter ${letterNumber} sent to your landlord`,
        messagePreview: `You approved Letter ${letterNumber} and Tribune sent it to ${input.caseRow.landlord_name} in your name. Tribune will notify you when they respond.`,
        siteUrl,
      }),
    });
  } catch (err) {
    console.error("[approveAndSendLetter] tenant confirmation failed:", err);
  }

  try {
    // Case id and link only: no names, addresses, or amounts.
    await sendEmail({
      to: process.env.ADMIN_EMAIL || "hello@usetribune.org",
      subject: `Tenant approved and sent Letter ${letterNumber} (case ${caseId.slice(0, 8)})`,
      html: `<p>A tenant approved Letter ${letterNumber} and Tribune sent it.</p><p><a href="${siteUrl}/admin/case/${caseId}">Open the case</a></p>`,
    });
  } catch (err) {
    console.error("[approveAndSendLetter] admin FYI failed:", err);
  }

  revalidatePath(`/admin/case/${caseId}`);
  revalidatePath(`/dashboard/case/${caseId}`);
  return { success: true };
}

// The tenant adds a detail Letter 1 needs (landlord email or forwarding address)
// before any letter has gone out. Runs under the tenant's session; RLS limits
// the update to their own case.
const CONTACT_DETAIL_LABELS: Record<ContactDetailField, string> = {
  landlord_email: "your landlord's email address",
  forwarding_address: "your forwarding address",
};

export async function updateLetterContactDetail(
  caseId: string,
  field: ContactDetailField,
  value: string
) {
  if (!(field in CONTACT_DETAIL_LABELS)) return { error: "Unknown field" };
  const parsed = parseContactDetail(field, value);
  if (!parsed.ok) return { error: parsed.message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: updated, error } = await supabase
    .from("cases")
    .update({ [field]: parsed.value })
    .eq("id", caseId)
    .eq("tenant_id", user.id)
    .eq("current_letter_number", 0)
    .in("status", ["intake_submitted", "under_review"])
    .select("id");
  if (error) return { error: "Tribune couldn't save that. Try again." };
  if (!updated?.length) return { error: "This case can't be changed at this stage." };

  // No value in the message: the timeline records that it changed, not what to.
  await supabase.from("case_messages").insert({
    case_id: caseId,
    message_type: "system",
    title: `You added ${CONTACT_DETAIL_LABELS[field]}`,
    body: `You added ${CONTACT_DETAIL_LABELS[field]} so Tribune can send your demand letter.`,
    created_by: user.id,
  });

  revalidatePath(`/admin/case/${caseId}`);
  revalidatePath(`/dashboard/case/${caseId}`);
  return { success: true };
}
