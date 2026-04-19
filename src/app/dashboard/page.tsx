"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { type Case, STATUS_LABELS } from "@/lib/types/database";
import { formatCents } from "@/lib/utils/case";
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
    case "letter_ready":
      return {
        label: "Your demand letter is ready.",
        action: "Review it and confirm you've sent it to your landlord.",
      };
    case "letter_sent":
    case "awaiting_landlord":
      return {
        label: "Waiting for your landlord to respond.",
        action: "If they reply or return your deposit, log it in your case.",
      };
    case "landlord_responded":
      return { label: "Tribune is preparing your next response.", action: null };
    case "resolved":
      return { label: "Case resolved.", action: null };
    case "closed":
      return { label: "Case closed.", action: null };
    default:
      return { label: "Case in progress.", action: null };
  }
}

// ─── Single-case hero view ─────────────────────────────────────────────────────

function SingleCaseView({ c }: { c: Case }) {
  const deadline = new Date(c.statutory_deadline);
  const daysUntilDeadline = differenceInDays(deadline, new Date());
  const isOverdue = daysUntilDeadline < 0 && !["resolved", "closed"].includes(c.status);
  const isTerminal = c.status === "resolved" || c.status === "closed";

  const originalReturnedCents = c.deposit_amount_cents - c.amount_withheld_cents;
  const actualRecoveredCents = Math.max(0, c.deposit_returned_cents - originalReturnedCents);
  const displayCents = isTerminal ? actualRecoveredCents : c.amount_withheld_cents;
  const tribFee = Math.round((displayCents * c.contingency_pct) / 100);
  const netCents = displayCents - tribFee;

  const { label, action } = statusDescription(c.status);

  return (
    <div className="space-y-4">
      {/* Case identity */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-xl font-semibold ${s.serif}`}>{c.property_address}</h1>
          <p className={`mt-1 ${s.caseVs}`}>vs. {c.landlord_name}</p>
        </div>
        <span className={s.statusPill} style={{ color: "var(--muted)" }}>
          {STATUS_LABELS[c.status]}
        </span>
      </div>

      <hr className={s.rule} />

      {/* Recovery hero */}
      <div className={s.cardBone}>
        <p className={s.label}>{isTerminal ? "Amount recovered" : "Est. recovery"}</p>
        <p className={`mt-2 ${isTerminal && netCents > 0 ? s.bigNumberGreen : s.bigNumber}`}>
          {formatCents(netCents)}
        </p>
        {!isTerminal && (
          <p className={`mt-1 ${s.label}`}>
            {CONTINGENCY_PCT}% Tribune fee already deducted
          </p>
        )}
        <div className={s.metaGrid}>
          <div className={s.metaCell}>
            <p className={s.metaCellLabel}>{isTerminal ? "Recovered" : "Withheld"}</p>
            <p className={s.metaCellValue}>{formatCents(displayCents)}</p>
          </div>
          <div className={s.metaCell}>
            <p className={s.metaCellLabel}>Tribune ({c.contingency_pct}%)</p>
            <p className={s.metaCellMuted}>−{formatCents(tribFee)}</p>
          </div>
          <div className={s.metaCell}>
            <p className={s.metaCellLabel}>Your net</p>
            <p className={s.metaCellValue}>{formatCents(netCents)}</p>
          </div>
        </div>
      </div>

      {/* Status + next action */}
      {action ? (
        <div className={s.notice}>
          <p className={s.noticeLabel}>{label}</p>
          <p className={s.noticeBody}>{action}</p>
        </div>
      ) : (
        <div className={s.statusCard}>
          <p className={s.statusCardLabel}>{label}</p>
        </div>
      )}

      {/* Deadline */}
      <div className={s.deadlineRow}>
        <span className={s.deadlineLabel}>Statutory deadline</span>
        <span className={`${s.deadlineValue} ${isOverdue ? s.deadlineUrgent : ""}`}>
          {format(deadline, "MMMM d, yyyy")}
          {isOverdue && <span className={`ml-2 ${s.label}`}>({Math.abs(daysUntilDeadline)}d overdue)</span>}
          {!isOverdue && daysUntilDeadline <= 30 && (
            <span className={`ml-2 ${s.label}`}>{daysUntilDeadline}d left</span>
          )}
        </span>
      </div>

      <Button size="lg" className="w-full rounded-none" render={<Link href={`/dashboard/case/${c.id}`} />}>
        Open Your Case <ArrowRight className="ml-2 size-4" />
      </Button>

      <LegalDisclaimer />
    </div>
  );
}

// ─── Multi-case list view ──────────────────────────────────────────────────────

function MultiCaseView({ cases }: { cases: Case[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className={`text-2xl font-semibold ${s.serif}`}>Your Cases</h1>
          <p className={`mt-1 ${s.label}`}>{cases.length} case{cases.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" className="rounded-none" render={<Link href="/dashboard/new-case" />}>
          <PlusCircle className="mr-1.5 size-4" /> New Case
        </Button>
      </div>

      <div className="space-y-2">
        {cases.map((c) => {
          const deadline = new Date(c.statutory_deadline);
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

              {action && (
                <p className={`mb-3 ${s.notice}`}>{action}</p>
              )}

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

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      const supabase = createClient();
      const { data } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });
      setCases(data || []);
      setLoading(false);
    }
    loadCases();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 rounded-none" />
        <Skeleton className="h-40 rounded-none" />
        <Skeleton className="h-16 rounded-none" />
        <Skeleton className="h-10 rounded-none" />
      </div>
    );
  }

  if (cases.length === 0) {
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
        <Button size="lg" className="rounded-none" render={<Link href="/dashboard/new-case" />}>
          Start Your Case <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    );
  }

  if (cases.length === 1) {
    return <SingleCaseView c={cases[0]} />;
  }

  return <MultiCaseView cases={cases} />;
}
