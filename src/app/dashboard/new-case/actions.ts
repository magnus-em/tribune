"use server";

import { createClient } from "@/lib/supabase/server";
import { addDays } from "date-fns";
import { CONTINGENCY_PCT, STATUTE_DAYS } from "@/lib/constants";
import { intakeSchema, type IntakeFormData } from "@/lib/schemas/intake";

export async function createCase(formData: IntakeFormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const parsed = intakeSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Invalid form data", details: parsed.error.issues };
  }

  const data = parsed.data;

  // Update profile with name and phone (best-effort, don't block case creation).
  // Profile row is created by the on_auth_user_created trigger — we just update it.
  await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      phone: data.phone || null,
    })
    .eq("id", user.id);

  // Calculate values
  const moveOutDate = new Date(data.move_out_date);
  const statutoryDeadline = addDays(moveOutDate, STATUTE_DAYS);
  const depositAmountCents = Math.round(parseFloat(data.deposit_amount) * 100);
  const amountWithheldCents = Math.round(
    parseFloat(data.amount_withheld) * 100
  );

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .insert({
      tenant_id: user.id,
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
      forwarding_address: data.forwarding_address,
      deposit_amount_cents: depositAmountCents,
      deposit_returned_cents: depositAmountCents - amountWithheldCents,
      amount_withheld_cents: amountWithheldCents,
      withholding_reason: data.withholding_reason || null,
      itemized_deductions_received: data.itemized_deductions_received,
      situation_description: data.situation_description,
      contingency_pct: CONTINGENCY_PCT,
      contingency_agreed_at: new Date().toISOString(),
      statutory_deadline: statutoryDeadline.toISOString().split("T")[0],
    })
    .select("id")
    .single();

  if (caseError || !caseRow) {
    console.error("[createCase] Failed to insert case:", caseError);
    return { error: "Failed to create case: " + (caseError?.message ?? "unknown") };
  }

  return { success: true, caseId: caseRow.id };
}
