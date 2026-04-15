"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { type Case, STATUS_LABELS } from "@/lib/types/database";
import { statusColor, formatCents } from "@/lib/utils/case";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Scale,
  TrendingUp,
} from "lucide-react";

function getStatusIcon(status: string) {
  switch (status) {
    case "letter_ready":
      return <FileText className="size-4 text-yellow-600" />;
    case "resolved":
      return <CheckCircle2 className="size-4 text-green-600" />;
    case "landlord_responded":
      return <AlertCircle className="size-4 text-orange-600" />;
    default:
      return <Clock className="size-4 text-blue-600" />;
  }
}

function nextActionForTenant(status: string): string | null {
  switch (status) {
    case "letter_ready":
      return "Review and send your demand letter";
    case "letter_sent":
    case "awaiting_landlord":
      return "Submit landlord's response when received";
    default:
      return null;
  }
}

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      console.log("[Dashboard] user:", user?.id, user?.email);

      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("[Dashboard] cases query:", { count: data?.length, error });
      setCases(data || []);
      setLoading(false);
    }
    loadCases();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
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
            <CheckCircle2 className="size-4 text-green-600" /> 10% contingency
          </span>
        </div>
        <Button size="lg" render={<Link href="/dashboard/new-case" />}>
          Start Your Case <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    );
  }

  const activeCases = cases.filter(
    (c) => !["resolved", "closed"].includes(c.status)
  );
  const resolvedCases = cases.filter((c) => c.status === "resolved");
  const totalWithheld = cases.reduce(
    (sum, c) => sum + c.amount_withheld_cents,
    0
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your security deposit recovery cases.
          </p>
        </div>
        <Button size="sm" render={<Link href="/dashboard/new-case" />}>
          <PlusCircle className="mr-1.5 size-4" /> New Case
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-xl">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Active Cases
              </span>
              <TrendingUp className="size-4 text-muted-foreground/50" />
            </div>
            <p className="text-3xl font-bold tracking-tight mt-1">
              {activeCases.length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Resolved
              </span>
              <CheckCircle2 className="size-4 text-green-600/50" />
            </div>
            <p className="text-3xl font-bold tracking-tight mt-1 text-green-700">
              {resolvedCases.length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Total at Stake
              </span>
              <Scale className="size-4 text-muted-foreground/50" />
            </div>
            <p className="text-3xl font-bold tracking-tight mt-1">
              {formatCents(totalWithheld)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Cases */}
      <div className="space-y-3">
        {cases.map((c) => {
          const deadline = new Date(c.statutory_deadline);
          const today = new Date();
          const daysOverdue = differenceInDays(today, deadline);
          const isOverdue =
            daysOverdue > 0 && !["resolved", "closed"].includes(c.status);
          const nextAction = nextActionForTenant(c.status);

          return (
            <Link key={c.id} href={`/dashboard/case/${c.id}`} className="block">
              <Card
                className={`rounded-xl transition-all hover:shadow-md hover:border-foreground/20 ${
                  isOverdue ? "border-red-300" : ""
                }`}
              >
                <CardContent className="py-4 space-y-3">
                  {/* Top row: address + status */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getStatusIcon(c.status)}
                      <span className="font-medium truncate">
                        {c.property_address}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-xs ${statusColor(c.status)}`}
                    >
                      {STATUS_LABELS[c.status]}
                    </Badge>
                  </div>

                  {/* Action banner */}
                  {nextAction && (
                    <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                      <AlertCircle className="size-3.5 shrink-0" />
                      <span className="font-medium text-xs">{nextAction}</span>
                    </div>
                  )}

                  {/* Metrics row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm pt-1">
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Deposit
                      </span>
                      <span className="font-semibold text-sm">
                        {formatCents(c.deposit_amount_cents)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Withheld
                      </span>
                      <span className="font-semibold text-sm">
                        {formatCents(c.amount_withheld_cents)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs block mb-0.5">
                        Deadline
                      </span>
                      <span className="font-semibold text-sm">
                        {format(deadline, "MMM d, yyyy")}
                        {isOverdue && (
                          <span className="text-destructive ml-1">
                            (+{daysOverdue}d)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <LegalDisclaimer />
    </div>
  );
}
