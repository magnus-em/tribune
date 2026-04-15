import { type CaseStatus } from "@/lib/types/database";

export function statusColor(status: string): string {
  switch (status) {
    case "letter_ready":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "resolved":
      return "bg-green-100 text-green-800 border-green-200";
    case "closed":
      return "bg-gray-100 text-gray-800 border-gray-200";
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
  return status === "resolved" || status === "closed";
}
