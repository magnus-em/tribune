"use server";

import { createClient } from "@/lib/supabase/server";

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

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "File size must be less than 10MB" };
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
