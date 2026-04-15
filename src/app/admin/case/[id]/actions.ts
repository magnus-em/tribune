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

async function getCaseWithTenant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  caseId: string
) {
  // Query case and tenant profile separately to avoid RLS join issues
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("property_address, tenant_id")
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
    tenant_name: profile?.full_name || "Tenant",
    tenant_email: profile?.email || null,
  };
}

export async function postLetterWithNotification({
  caseId,
  title,
  body,
  letterNumber,
}: PostLetterParams) {
  try {
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

    if (insertError) {
      console.error("[postLetter] insert failed:", insertError);
      return { error: "Failed to save letter: " + insertError.message };
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
      console.error("[postLetter] status update failed:", updateError);
      return { error: "Failed to update status: " + updateError.message };
    }

    // Send email notification (best-effort — don't fail the action if email fails)
    if (caseData.tenant_email) {
      try {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "https://usetribune.org";
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
      } catch (emailErr) {
        console.error("[postLetter] email failed:", emailErr);
        // Don't return error — letter was saved successfully
      }
    }

    revalidatePath(`/admin/case/${caseId}`);
    revalidatePath(`/dashboard/case/${caseId}`);

    return { success: true };
  } catch (err) {
    console.error("[postLetter] unexpected error:", err);
    return { error: "Something went wrong: " + String(err) };
  }
}

export async function postUpdateWithNotification({
  caseId,
  title,
  body,
}: PostUpdateParams) {
  try {
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
    const { error: insertError } = await supabase
      .from("case_messages")
      .insert({
        case_id: caseId,
        message_type: "tribune_update",
        title: title.trim(),
        body: body.trim(),
        created_by: user.id,
      });

    if (insertError) {
      console.error("[postUpdate] insert failed:", insertError);
      return { error: "Failed to save update: " + insertError.message };
    }

    // Send email notification (best-effort)
    if (caseData.tenant_email) {
      try {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "https://usetribune.org";
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
      } catch (emailErr) {
        console.error("[postUpdate] email failed:", emailErr);
      }
    }

    revalidatePath(`/admin/case/${caseId}`);
    revalidatePath(`/dashboard/case/${caseId}`);

    return { success: true };
  } catch (err) {
    console.error("[postUpdate] unexpected error:", err);
    return { error: "Something went wrong: " + String(err) };
  }
}
