import { type CaseStatus } from "@/lib/types/database";

export function statusColor(status: string): string {
  switch (status) {
    case "correspondence_ready":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "resolved":
      return "bg-green-100 text-green-800 border-green-200";
    case "closed":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "declined":
      return "bg-red-50 text-red-800 border-red-200";
    case "landlord_responded":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "intake_submitted":
    case "under_review":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "letter_sent":
    case "awaiting_landlord":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function isTerminalStatus(status: CaseStatus): boolean {
  return status === "resolved" || status === "closed" || status === "declined";
}

/**
 * Parse a Postgres `date` column value (e.g. "2026-05-06", which Supabase
 * returns as a plain date string) as a LOCAL calendar date.
 *
 * `new Date("2026-05-06")` parses as UTC midnight, which renders as the
 * PREVIOUS day in any timezone behind UTC (e.g. America/New_York). That
 * off-by-one silently corrupted move-out dates, lease dates, and the
 * statutory deadline shown in demand letters. Always use this for date-only
 * columns. (timestamptz columns like created_at/paid_at keep using `new Date`.)
 */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}
