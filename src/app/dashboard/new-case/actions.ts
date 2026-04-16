"use server";

import { createClient } from "@/lib/supabase/server";
import { addDays } from "date-fns";
import { CONTINGENCY_PCT, STATUTE_DAYS, MAX_FILE_SIZE_BYTES, ALLOWED_FILE_TYPES } from "@/lib/constants";
import { intakeSchema } from "@/lib/schemas/intake";
import type { ExtractedLeaseData } from "@/lib/schemas/intake";

// ─── Lease extraction ─────────────────────────────────────────────────────────

const EXTRACTION_SYSTEM_PROMPT = `You extract structured data from residential lease agreements.
Return ONLY valid JSON. Include only fields you can identify with confidence. Omit uncertain fields entirely.
Use ISO 8601 dates (YYYY-MM-DD). Deposit amount should be a number (dollars, no symbols).

Response format:
{
  "property_address": "full street address of the rental unit",
  "unit_number": "apartment/unit number if separate from address",
  "landlord_name": "landlord or property management company name",
  "landlord_email": "landlord email if present",
  "landlord_phone": "landlord phone if present",
  "landlord_address": "landlord mailing address if different from property",
  "lease_start_date": "YYYY-MM-DD",
  "lease_end_date": "YYYY-MM-DD",
  "deposit_amount_dollars": 1200
}`;

export async function extractLeaseData(formData: FormData): Promise<{
  data?: ExtractedLeaseData;
  error?: string;
}> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { error: "Extraction service not configured" };

  const file = formData.get("lease") as File | null;
  if (!file) return { error: "No file provided" };
  if (file.size > MAX_FILE_SIZE_BYTES) return { error: "File too large (max 10MB)" };

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let messages: unknown[];

  if (file.type === "application/pdf") {
    // Extract text from PDF using pdf-parse v2 class API, then use text model
    let text: string;
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      // v2 populates result.pages, not result.text — join pages manually
      text = result.pages
        .map((p: { text: string }) => p.text)
        .join("\n")
        .slice(0, 12000); // stay within token budget
    } catch {
      return { error: "Could not read PDF — try uploading a photo instead" };
    }

    messages = [
      {
        role: "user",
        content: `Extract lease information from this document text:\n\n${text}`,
      },
    ];
  } else {
    // Image: pass to vision model
    const base64 = buffer.toString("base64");
    messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract lease information from this document image.",
          },
          {
            type: "image_url",
            image_url: { url: `data:${file.type};base64,${base64}` },
          },
        ],
      },
    ];
  }

  const model = "grok-3";

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          ...messages,
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[extractLeaseData] xAI error:", err);
      return { error: "Extraction failed — you can fill in the details manually" };
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) return { error: "No extraction result" };

    const extracted = JSON.parse(content) as ExtractedLeaseData;
    return { data: extracted };
  } catch (err) {
    console.error("[extractLeaseData] error:", err);
    return { error: "Extraction failed — you can fill in the details manually" };
  }
}

// ─── Create case ──────────────────────────────────────────────────────────────

export async function createCase(formData: FormData): Promise<{
  caseId?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const userId = user.id; // capture for use in inner functions

  // Parse and validate all text fields
  const raw = {
    full_name: formData.get("full_name") as string,
    phone: formData.get("phone") as string,
    fwd_street: formData.get("fwd_street") as string,
    fwd_unit: (formData.get("fwd_unit") as string) || undefined,
    fwd_city: formData.get("fwd_city") as string,
    fwd_state: formData.get("fwd_state") as string,
    fwd_zip: formData.get("fwd_zip") as string,
    property_address: formData.get("property_address") as string,
    unit_number: (formData.get("unit_number") as string) || undefined,
    lease_start_date: formData.get("lease_start_date") as string,
    lease_end_date: formData.get("lease_end_date") as string,
    move_out_date: formData.get("move_out_date") as string,
    landlord_name: formData.get("landlord_name") as string,
    landlord_email: (formData.get("landlord_email") as string) || undefined,
    landlord_phone: (formData.get("landlord_phone") as string) || undefined,
    landlord_address: (formData.get("landlord_address") as string) || undefined,
    deposit_amount: formData.get("deposit_amount") as string,
    amount_withheld: formData.get("amount_withheld") as string,
    landlord_stated_reason: (formData.get("landlord_stated_reason") as string) || undefined,
    itemized_deductions_received: formData.get("itemized_deductions_received") === "true",
    notice_given: formData.get("notice_given") as "yes" | "no",
    notice_given_desc: (formData.get("notice_given_desc") as string) || undefined,
    preexisting_damage: formData.get("preexisting_damage") as "yes" | "no",
    preexisting_damage_desc: (formData.get("preexisting_damage_desc") as string) || undefined,
    apartment_condition: formData.get("apartment_condition") as string,
    landlord_contact_since: formData.get("landlord_contact_since") as "yes" | "no",
    landlord_contact_desc: (formData.get("landlord_contact_desc") as string) || undefined,
    initials_key_clause: formData.get("initials_key_clause") as string,
    signature_name: formData.get("signature_name") as string,
  };

  const parsed = intakeSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid form data";
    return { error: first };
  }

  const data = parsed.data;

  // Compose forwarding address
  const forwarding_address = [
    data.fwd_street,
    data.fwd_unit,
    data.fwd_city,
    data.fwd_state,
    data.fwd_zip,
  ]
    .filter(Boolean)
    .join(", ");

  // Synthesize situation_description from structured answers
  const situation_description = [
    `Landlord's stated reason for withholding: ${data.landlord_stated_reason?.trim() || "None provided"}`,
    `Written notice given before move-out: ${data.notice_given === "yes" ? "Yes" : `No${data.notice_given_desc ? ` — ${data.notice_given_desc}` : ""}`}`,
    `Pre-existing damage at move-in: ${data.preexisting_damage === "yes" ? `Yes — ${data.preexisting_damage_desc || "not described"}` : "None noted"}`,
    `Apartment condition at move-out: ${data.apartment_condition}`,
    `Contact with landlord since moving out: ${data.landlord_contact_since === "yes" ? `Yes — ${data.landlord_contact_desc || "not described"}` : "None"}`,
  ].join("\n");

  // Calculate money and deadline
  const moveOutDate = new Date(data.move_out_date);
  const statutoryDeadline = addDays(moveOutDate, STATUTE_DAYS);
  const depositAmountCents = Math.round(parseFloat(data.deposit_amount) * 100);
  const amountWithheldCents = Math.round(parseFloat(data.amount_withheld) * 100);

  // Update tenant profile
  await supabase
    .from("profiles")
    .update({ full_name: data.full_name, phone: data.phone || null })
    .eq("id", userId);

  // Insert case
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .insert({
      tenant_id: userId,
      status: "intake_submitted",
      property_address: data.property_address,
      unit_number: data.unit_number || null,
      landlord_name: data.landlord_name,
      landlord_email: data.landlord_email || null,
      landlord_phone: data.landlord_phone || null,
      landlord_address: data.landlord_address || null,
      lease_start_date: data.lease_start_date,
      lease_end_date: data.lease_end_date,
      move_out_date: data.move_out_date,
      forwarding_address,
      deposit_amount_cents: depositAmountCents,
      deposit_returned_cents: depositAmountCents - amountWithheldCents,
      amount_withheld_cents: amountWithheldCents,
      withholding_reason: data.landlord_stated_reason || null,
      itemized_deductions_received: data.itemized_deductions_received,
      situation_description,
      contingency_pct: CONTINGENCY_PCT,
      contingency_agreed_at: new Date().toISOString(),
      contingency_signature_name: data.signature_name,
      statutory_deadline: statutoryDeadline.toISOString().split("T")[0],
    })
    .select("id")
    .single();

  if (caseError || !caseRow) {
    console.error("[createCase] insert failed:", caseError);
    return { error: "Failed to create case: " + (caseError?.message ?? "unknown") };
  }

  const caseId = caseRow.id;

  // Upload all files
  const uploadErrors: string[] = [];

  async function uploadFile(file: File, kind: string) {
    if (!file || file.size === 0) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      uploadErrors.push(`${file.name} is too large (max 10MB)`);
      return;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
      uploadErrors.push(`${file.name} is not a supported file type`);
      return;
    }

    const ext = file.name.split(".").pop();
    const storagePath = `case_documents/${caseId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("case-documents")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      uploadErrors.push(`Failed to upload ${file.name}`);
      return;
    }

    await supabase.from("case_documents").insert({
      case_id: caseId,
      kind,
      storage_path: storagePath,
      original_filename: file.name,
      content_type: file.type,
      size_bytes: file.size,
      uploaded_by: userId,
    });
  }

  // Lease (required)
  const leaseFile = formData.get("lease") as File | null;
  if (leaseFile && leaseFile.size > 0) {
    await uploadFile(leaseFile, "lease");
  }

  // Itemized deductions list (optional)
  const itemizedFile = formData.get("itemized_list") as File | null;
  if (itemizedFile && itemizedFile.size > 0) {
    await uploadFile(itemizedFile, "deduction_itemization");
  }

  // Move-in photos (optional, multiple)
  const moveInPhotos = formData.getAll("move_in_photos") as File[];
  for (const photo of moveInPhotos) {
    if (photo.size > 0) await uploadFile(photo, "photo_move_in");
  }

  // Move-out photos (optional, multiple)
  const moveOutPhotos = formData.getAll("move_out_photos") as File[];
  for (const photo of moveOutPhotos) {
    if (photo.size > 0) await uploadFile(photo, "photo_move_out");
  }

  if (uploadErrors.length > 0) {
    // Case created successfully — log upload errors but don't fail
    console.error("[createCase] upload errors:", uploadErrors);
  }

  return { caseId };
}
