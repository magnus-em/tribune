import { NextResponse, type NextRequest } from "next/server";
import { checkBackend } from "@/lib/health";
import { isAuthorizedCronRequest } from "@/lib/letters/follow-up-notice";
import { sendEmail } from "@/lib/email/client";

export const dynamic = "force-dynamic";

/**
 * Public health check: 200 when Supabase Auth and Postgres answer, 503 when
 * not. The build loop curls it every tick. A daily Vercel cron (vercel.json)
 * calls it too, which keeps the free-tier project active, and emails
 * ADMIN_EMAIL when the backend is down. Only the cron's call can send email.
 */
export async function GET(request: NextRequest) {
  const health = await checkBackend(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const ok = health.auth && health.db;

  if (!ok && isAuthorizedCronRequest(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    console.error("[health] backend unreachable", health);
    await sendEmail({
      to: process.env.ADMIN_EMAIL || "hello@usetribune.org",
      subject: "Tribune backend is down",
      html: `<p>The daily health check could not reach Supabase (auth: ${health.auth ? "up" : "down"}, database: ${health.db ? "up" : "down"}).</p><p>Sign-in and every dashboard page fail until it is back. If the project is paused, restore it in the Supabase dashboard.</p>`,
    });
  }

  return NextResponse.json(
    { ok, ...health },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
