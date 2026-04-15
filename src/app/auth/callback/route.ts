import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { CONTINGENCY_PCT, STATUTE_DAYS } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();

    // Exchange code for session
    const { error: authError } = await supabase.auth.exchangeCodeForSession(code);

    if (!authError) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if there's a pending case for this user
        const { data: pendingCase } = await supabase
          .from("pending_cases")
          .select("*")
          .eq("email", user.email)
          .single();

        if (pendingCase) {
          // Create case from pending data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const payload = pendingCase.payload as any;

          // Calculate statutory deadline (move_out_date + STATUTE_DAYS)
          const moveOutDate = new Date(payload.move_out_date);
          const statutoryDeadline = addDays(moveOutDate, STATUTE_DAYS);

          // Convert dollar amounts to cents
          const depositAmountCents = Math.round(parseFloat(payload.deposit_amount) * 100);
          const amountWithheldCents = Math.round(parseFloat(payload.amount_withheld) * 100);

          // Insert case
          const { error: caseError } = await supabase.from("cases").insert({
            tenant_id: user.id,
            status: "intake_submitted",

            // Property
            property_address: payload.property_address,
            unit_number: payload.unit_number || null,

            // Landlord
            landlord_name: payload.landlord_name,
            landlord_email: payload.landlord_email || null,
            landlord_phone: payload.landlord_phone || null,
            landlord_address: payload.landlord_address || null,

            // Lease
            lease_start_date: payload.lease_start_date,
            lease_end_date: payload.lease_end_date,
            move_out_date: payload.move_out_date,
            forwarding_address: payload.forwarding_address,

            // Deposit
            deposit_amount_cents: depositAmountCents,
            deposit_returned_cents: depositAmountCents - amountWithheldCents,
            amount_withheld_cents: amountWithheldCents,
            withholding_reason: payload.withholding_reason || null,
            itemized_deductions_received: payload.itemized_deductions_received,
            situation_description: payload.situation_description,

            // Agreement
            contingency_pct: CONTINGENCY_PCT,
            contingency_agreed_at: new Date().toISOString(),

            // Tracking
            statutory_deadline: statutoryDeadline.toISOString().split('T')[0], // Date only
          });

          if (!caseError) {
            // Delete the pending case
            await supabase.from("pending_cases").delete().eq("id", pendingCase.id);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
