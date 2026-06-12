import { redirect } from "next/navigation";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { type Case, STATUS_LABELS } from "@/lib/types/database";
import { formatCents, parseDateOnly } from "@/lib/utils/case";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { CONTINGENCY_PCT } from "@/lib/constants";
import { ArrowRight, PlusCircle, CheckCircle2 } from "lucide-react";
import s from "./dashboard.module.css";

function statusDescription(status: string): { label: string; action: string | null } {
  switch (status) {
    case "intake_submitted":
      return { label: "Case submitted — Tribune will review shortly.", action: null };
    case "under_review":
      return { label: "Tribune is reviewing your case.", action: null };
    case "correspondence_ready":
      return { label: "Tribune is preparing to contact your landlord.", action: null };
    case "letter_sent":
    case "awaiting_landlord":
      return {
        label: "Tribune has contacted your landlord.",
        action: "If your landlord returns your deposit, report it in your case.",
      };
    case "landlord_responded":
      return { label: "Landlord has responded — Tribune is preparing next steps.", action: null };
    case "resolved":
      return { label: "Case resolved.", action: null };
    case "closed":
      return { label: "Case closed.", action: null };
    default:
      return { label: "Case in progress.", action: null };
  }
}

// ─── Multi-case list (fallback for the rare tenant with >1 case) ──────────────

function MultiCaseView({ cases }: { cases: Case[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`text-2xl font-semibold ${s.serif}`}>Your Cases</h1>
          <p className={`mt-1 ${s.label}`}>{cases.length} case{cases.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" render={<Link href="/dashboard/new-case" />}>
          <PlusCircle className="mr-1.5 size-4" /> New Case
        </Button>
      </div>

      <div className="space-y-2">
        {cases.map((c) => {
          const deadline = parseDateOnly(c.statutory_deadline);
          const daysUntilDeadline = differenceInDays(deadline, new Date());
          const isOverdue =
            daysUntilDeadline < 0 && !["resolved", "closed"].includes(c.status);
          const isTerminal = c.status === "resolved" || c.status === "closed";

          const originalReturnedCents = c.deposit_amount_cents - c.amount_withheld_cents;
          const displayCents = isTerminal
            ? Math.max(0, c.deposit_returned_cents - originalReturnedCents)
            : c.amount_withheld_cents;
          const netCents = displayCents - Math.round((displayCents * c.contingency_pct) / 100);

          const { action } = statusDescription(c.status);

          return (
            <Link
              key={c.id}
              href={`/dashboard/case/${c.id}`}
              className={`${s.caseRow} ${isOverdue ? s.caseRowOverdue : ""}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className={s.caseAddress}>{c.property_address}</p>
                  <p className={s.caseVs}>vs. {c.landlord_name}</p>
                </div>
                <span className={s.statusPill} style={{ color: "var(--muted)" }}>
                  {STATUS_LABELS[c.status]}
                </span>
              </div>

              {action && <p className={`mb-3 ${s.notice}`}>{action}</p>}

              <div className="flex items-end justify-between">
                <div>
                  <p className={s.metaCellLabel}>{isTerminal ? "Recovered" : "At stake"} · net</p>
                  <p className={`${s.mono} text-base font-bold`} style={{ color: "var(--ink)" }}>
                    {formatCents(netCents)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={s.metaCellLabel}>Deadline</p>
                  <p className={`${s.deadlineValue} ${isOverdue ? s.deadlineUrgent : ""}`}>
                    {format(deadline, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <LegalDisclaimer />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  const list: Case[] = cases ?? [];

  // Single-case tenants (the 95% case) jump straight to the case page —
  // the case page IS their dashboard.
  if (list.length === 1) {
    redirect(`/dashboard/case/${list[0].id}`);
  }

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className={s.emptyMark}>§</div>
        <h2 className={s.emptyHeading}>Ready to recover your deposit?</h2>
        <p className={s.emptyBody}>
          It takes about 5 minutes to submit your case. We&apos;ll review it
          and prepare your first demand letter.
        </p>
        <div className={`flex items-center gap-6 mb-8 ${s.label}`}>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" style={{ color: "#2d6a35" }} /> Free to start
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" style={{ color: "#2d6a35" }} /> {CONTINGENCY_PCT}% contingency
          </span>
        </div>
        <Button size="lg" render={<Link href="/dashboard/new-case" />}>
          Start Your Case <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    );
  }

  return <MultiCaseView cases={list} />;
}
