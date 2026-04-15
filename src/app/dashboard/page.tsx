"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { type Case, STATUS_LABELS } from "@/lib/types/database";
import { statusColor, formatCents } from "@/lib/utils/case";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { CONTINGENCY_PCT } from "@/lib/constants";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Scale,
} from "lucide-react";

// Human-readable status descriptions shown on the dashboard card
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
      return {
        label: "Tribune is preparing your next response.",
        action: null,
      };
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

  // Money math
  const originalReturnedCents = c.deposit_amount_cents - c.amount_withheld_cents;
  const actualRecoveredCents = Math.max(0, c.deposit_returned_cents - originalReturnedCents);
  const displayCents = isTerminal ? actualRecoveredCents : c.amount_withheld_cents;
  const tribFee = Math.round((displayCents * c.contingency_pct) / 100);
  const netCents = displayCents - tribFee;

  const { label, action } = statusDescription(c.status);

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Case identity */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{c.property_address}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">vs. {c.landlord_name}</p>
        </div>
        <Badge variant="outline" className={`shrink-0 ${statusColor(c.status)}`}>
          {STATUS_LABELS[c.status]}
        </Badge>
      </div>

      {/* Recovery hero */}
      <div className="rounded-xl border bg-card p-6 text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isTerminal ? "Amount recovered" : "You could recover up to"}
        </p>
        <p
          className={`text-5xl font-bold tracking-tight ${
            isTerminal && netCents > 0 ? "text-green-700" : ""
          }`}
        >
          {formatCents(netCents)}
        </p>
        {!isTerminal && (
          <p className="text-xs text-muted-foreground">
            estimated net · {CONTINGENCY_PCT}% Tribune fee already deducted
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              {isTerminal ? "Recovered" : "Withheld"}
            </p>
            <p className="font-semibold">{formatCents(displayCents)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              Tribune ({c.contingency_pct}%)
            </p>
            <p className="font-semibold text-muted-foreground">−{formatCents(tribFee)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Your net</p>
            <p className="font-semibold">{formatCents(netCents)}</p>
          </div>
        </div>
      </div>

      {/* Status + next action */}
      <div
        className={`rounded-xl border p-4 space-y-1.5 ${
          action
            ? "border-blue-200 bg-blue-50"
            : "bg-muted/40"
        }`}
      >
        <div className="flex items-start gap-2">
          {action ? (
            <AlertCircle className="size-4 text-blue-700 shrink-0 mt-0.5" />
          ) : isTerminal ? (
            <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
          ) : (
            <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <p className={`text-sm font-medium ${action ? "text-blue-900" : ""}`}>{label}</p>
            {action && (
              <p className="text-xs text-blue-800/70">{action}</p>
            )}
          </div>
        </div>
      </div>

      {/* Deadline */}
      <div className="flex items-center justify-between text-sm px-1">
        <span className="text-muted-foreground">Statutory deadline</span>
        <span
          className={`font-medium ${
            isOverdue
              ? "text-destructive"
              : daysUntilDeadline <= 7
                ? "text-orange-600"
                : ""
          }`}
        >
          {format(deadline, "MMMM d, yyyy")}
          {isOverdue && (
            <span className="ml-1.5 text-xs">
              ({Math.abs(daysUntilDeadline)}d overdue)
            </span>
          )}
          {!isOverdue && daysUntilDeadline <= 30 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({daysUntilDeadline}d left)
            </span>
          )}
        </span>
      </div>

      {/* CTA */}
      <Button size="lg" className="w-full" render={<Link href={`/dashboard/case/${c.id}`} />}>
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
          <h1 className="text-2xl font-bold tracking-tight">Your Cases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {cases.length} case{cases.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" render={<Link href="/dashboard/new-case" />}>
          <PlusCircle className="mr-1.5 size-4" /> New Case
        </Button>
      </div>

      <div className="space-y-3">
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
            <Link key={c.id} href={`/dashboard/case/${c.id}`} className="block group">
              <div
                className={`rounded-xl border p-4 transition-all hover:shadow-sm hover:border-foreground/20 space-y-3 ${
                  isOverdue ? "border-destructive/40" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.property_address}</p>
                    <p className="text-xs text-muted-foreground">vs. {c.landlord_name}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${statusColor(c.status)}`}
                  >
                    {STATUS_LABELS[c.status]}
                  </Badge>
                </div>

                {action && (
                  <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                    {action}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      {isTerminal ? "Recovered" : "At stake"} · your net
                    </p>
                    <p className="font-bold text-base">{formatCents(netCents)}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p
                      className={`text-sm font-medium ${
                        isOverdue ? "text-destructive" : ""
                      }`}
                    >
                      {format(deadline, "MMM d, yyyy")}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
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
      <div className="max-w-lg mx-auto space-y-5">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-6">
          <Scale className="size-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center tracking-tight">
          Ready to recover your deposit?
        </h2>
        <p className="text-muted-foreground mb-2 text-center max-w-sm">
          It takes about 5 minutes to submit your case. We&apos;ll analyze it
          and prepare your first demand letter.
        </p>
        <div className="flex items-center gap-5 text-sm text-muted-foreground mb-8">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-green-600" /> Free to start
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="size-4 text-green-600" /> {CONTINGENCY_PCT}% contingency
          </span>
        </div>
        <Button size="lg" render={<Link href="/dashboard/new-case" />}>
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
