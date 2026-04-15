"use server";

import { createClient } from "@/lib/supabase/server";
import { fullIntakeSchema } from "@/lib/schemas/intake";

export async function submitIntake(formData: unknown) {
  const supabase = await createClient();

  // Validate the intake data
  const parsed = fullIntakeSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Invalid form data", details: parsed.error.issues };
  }

  const data = parsed.data;
  const email = data.email; // email is in the tenant info section

  try {
    // Send magic link
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    if (authError) {
      return { error: "Failed to send magic link", details: authError.message };
    }

    // Store intake data in pending_cases
    const { error: dbError } = await supabase
      .from("pending_cases")
      .upsert({
        email,
        payload: data,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      }, {
        onConflict: "email", // If they submit again, update the payload
      });

    if (dbError) {
      return { error: "Failed to save intake data", details: dbError.message };
    }

    // Success - redirect to confirmation page
    return { success: true };
  } catch (err) {
    return { error: "An unexpected error occurred", details: String(err) };
  }
}
