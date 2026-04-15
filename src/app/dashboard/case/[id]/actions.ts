"use server";

import { createClient } from "@/lib/supabase/server";
import { MAX_FILE_SIZE_BYTES, ALLOWED_FILE_TYPES } from "@/lib/constants";

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

export async function confirmLetterSent(caseId: string, letterNumber: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: caseRow } = await supabase
    .from("cases")
    .select("tenant_id, status")
    .eq("id", caseId)
    .single();

  if (!caseRow || caseRow.tenant_id !== user.id) return { error: "Not authorized" };

  await supabase.from("case_actions").insert({
    case_id: caseId,
    action_type: "letter_sent",
    metadata: { letter_number: letterNumber, sent_date: new Date().toISOString() },
  });

  await supabase
    .from("cases")
    .update({ status: "awaiting_landlord" })
    .eq("id", caseId);

  return { success: true };
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
    .select("tenant_id, deposit_amount_cents, amount_withheld_cents")
    .eq("id", caseId)
    .single();

  if (!caseRow || caseRow.tenant_id !== user.id) return { error: "Not authorized" };

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
