"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { type Case, STATUS_LABELS } from "@/lib/types/database";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { FileText, AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react";

function statusColor(status: string): string {
  switch (status) {
    case "letter_ready":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "resolved":
      return "bg-green-100 text-green-800 border-green-200";
    case "closed":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "landlord_responded":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "letter_ready":
      return <FileText className="h-5 w-5 text-yellow-600" />;
    case "resolved":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "landlord_responded":
      return <AlertCircle className="h-5 w-5 text-orange-600" />;
    default:
      return <Clock className="h-5 w-5 text-blue-600" />;
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

      const { data: casesData } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      setCases(casesData || []);
      setLoading(false);
    }

    loadCases();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-slate-200 rounded w-48 animate-pulse" />
                <div className="h-6 bg-slate-200 rounded w-24 animate-pulse" />
              </div>
              <div className="flex gap-6">
                <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
                <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
                <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <FileText className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">No cases yet</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          Start your first case to recover your security deposit. We&apos;ll guide you through the process.
        </p>
        <Button asChild size="lg">
          <Link href="/intake">
            Start Your First Case <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const activeCases = cases.filter((c) => !["resolved", "closed"].includes(c.status));
  const resolvedCases = cases.filter((c) => c.status === "resolved");
  const totalWithheld = cases.reduce((sum, c) => sum + c.amount_withheld_cents, 0);

  return (
    <div className="space-y-6">
      <LegalDisclaimer />

      {/* Header with stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Your Cases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCases.length} active • {resolvedCases.length} resolved • ${(totalWithheld / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })} at stake
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/intake">
            Start New Case <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Cases list */}
      <div className="space-y-4">
        {cases.map((c) => {
          const deadline = new Date(c.statutory_deadline);
          const today = new Date();
          const daysOverdue = differenceInDays(today, deadline);
          const isOverdue = daysOverdue > 0 && !["resolved", "closed"].includes(c.status);
          const nextAction = nextActionForTenant(c.status);

          return (
            <Link key={c.id} href={`/dashboard/case/${c.id}`}>
              <Card
                className={`hover:bg-muted/50 transition-all cursor-pointer ${
                  isOverdue ? "border-red-200 bg-red-50/50" : ""
                } ${
                  nextAction ? "border-blue-200" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(c.status)}
                        <CardTitle className="text-lg">{c.property_address}</CardTitle>
                      </div>
                      {nextAction && (
                        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200 w-fit">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">{nextAction}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className={statusColor(c.status)}>
                      {STATUS_LABELS[c.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Deposit Paid</span>
                      <span className="font-medium">${(c.deposit_amount_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Amount Withheld</span>
                      <span className="font-medium">${(c.amount_withheld_cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Statutory Deadline</span>
                      <span className="font-medium">
                        {format(deadline, "MMM d, yyyy")}
                        {isOverdue && (
                          <span className="text-destructive ml-1 font-semibold">
                            (+{daysOverdue}d overdue)
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
    </div>
  );
}
