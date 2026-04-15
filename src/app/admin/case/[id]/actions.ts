"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import { renderCaseUpdateEmail } from "@/lib/email/templates/case-update";
import { revalidatePath } from "next/cache";

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

async function getCaseWithTenant(supabase: Awaited<ReturnType<typeof createClient>>, caseId: string) {
  const { data } = await supabase
    .from("cases")
    .select("property_address, tenant_id, profiles(full_name, email)")
    .eq("id", caseId)
    .single();

  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = data.profiles as any;
  return {
    property_address: data.property_address,
    tenant_name: profile?.full_name || "Tenant",
    tenant_email: profile?.email as string | null,
  };
}

export async function postLetterWithNotification({
  caseId,
  title,
  body,
  letterNumber,
}: PostLetterParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const caseData = await getCaseWithTenant(supabase, caseId);
  if (!caseData) {
    return { error: "Case not found" };
  }

  // Insert the letter message
  const { error: insertError } = await supabase.from("case_messages").insert({
    case_id: caseId,
    message_type: "tribune_letter",
    title: title.trim(),
    body: body.trim(),
    letter_number: letterNumber,
    created_by: user.id,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  // Update case status to letter_ready
  const { error: updateError } = await supabase
    .from("cases")
    .update({
      status: "letter_ready",
      current_letter_number: letterNumber,
    })
    .eq("id", caseId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Send email notification
  if (caseData.tenant_email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://usetribune.org";
    const emailHtml = renderCaseUpdateEmail({
      tenantName: caseData.tenant_name.split(" ")[0],
      caseId,
      messageTitle: title,
      messagePreview:
        "Your demand letter is ready for review. Sign in to view and send it to your landlord.",
      siteUrl,
    });

    await sendEmail({
      to: caseData.tenant_email,
      subject: `Demand Letter ${letterNumber} Ready — ${caseData.property_address}`,
      html: emailHtml,
    });
  }

  revalidatePath(`/admin/case/${caseId}`);
  revalidatePath(`/dashboard/case/${caseId}`);

  return { success: true };
}

export async function postUpdateWithNotification({
  caseId,
  title,
  body,
}: PostUpdateParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const caseData = await getCaseWithTenant(supabase, caseId);
  if (!caseData) {
    return { error: "Case not found" };
  }

  // Insert the update message
  const { error: insertError } = await supabase.from("case_messages").insert({
    case_id: caseId,
    message_type: "tribune_update",
    title: title.trim(),
    body: body.trim(),
    created_by: user.id,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  // Send email notification
  if (caseData.tenant_email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://usetribune.org";
    const emailHtml = renderCaseUpdateEmail({
      tenantName: caseData.tenant_name.split(" ")[0],
      caseId,
      messageTitle: title,
      messagePreview:
        body.substring(0, 200) + (body.length > 200 ? "..." : ""),
      siteUrl,
    });

    await sendEmail({
      to: caseData.tenant_email,
      subject: `Case Update — ${caseData.property_address}`,
      html: emailHtml,
    });
  }

  revalidatePath(`/admin/case/${caseId}`);
  revalidatePath(`/dashboard/case/${caseId}`);

  return { success: true };
}
