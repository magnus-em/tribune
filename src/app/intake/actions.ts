"use server";

import { createClient } from "@/lib/supabase/server";
// import { fullIntakeSchema } from "@/lib/schemas/intake"; // Disabled for testing

export async function submitIntake(formData: unknown) {
  const supabase = await createClient();

  // VALIDATION DISABLED FOR TESTING - Re-enable before production!
  // const parsed = fullIntakeSchema.safeParse(formData);
  // if (!parsed.success) {
  //   return { error: "Invalid form data", details: parsed.error.issues };
  // }
  // const data = parsed.data;

  // Cast directly without validation (TESTING ONLY!)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = formData as any;
  const email = data.email; // email is in the tenant info section

  console.log("[submitIntake] Processing intake for:", email);
  console.log("[submitIntake] Data:", data);

  try {
    // TESTING MODE: Skip email, just save to pending_cases
    // The user will manually navigate to /auth/callback to complete signup
    console.log("[submitIntake] TESTING MODE: Skipping magic link email");

    // // Uncomment this when ready for real email sending:
    // const { error: authError } = await supabase.auth.signInWithOtp({
    //   email,
    //   options: {
    //     emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    //   },
    // });
    // if (authError) {
    //   console.error("[submitIntake] Auth error:", authError);
    //   return { error: "Failed to send magic link", details: authError.message };
    // }

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
