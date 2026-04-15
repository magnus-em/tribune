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

function statusColor(status: string): string {
  switch (status) {
    case "letter_ready":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "resolved":
      return "bg-green-100 text-green-800 border-green-200";
    case "closed":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-blue-100 text-blue-800 border-blue-200";
  }
}

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      const supabase = createClient();

      // Load all cases (case creation now happens in auth callback via server-side pending_cases)
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
    return <p className="text-muted-foreground">Loading your cases...</p>;
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-2">No cases yet</h2>
        <p className="text-muted-foreground mb-6">
          Start a case to recover your security deposit.
        </p>
        <Button asChild>
          <Link href="/intake">Start a Case</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LegalDisclaimer />
      <h1 className="text-2xl font-bold">Your Cases</h1>
      {cases.map((c) => {
        const deadline = new Date(c.statutory_deadline);
        const today = new Date();
        const daysOverdue = differenceInDays(today, deadline);

        return (
          <Link key={c.id} href={`/dashboard/case/${c.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{c.property_address}</CardTitle>
                  <Badge variant="outline" className={statusColor(c.status)}>
                    {STATUS_LABELS[c.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span>
                    Deposit: <strong className="text-foreground">${(c.deposit_amount_cents / 100).toFixed(2)}</strong>
                  </span>
                  <span>
                    Withheld: <strong className="text-foreground">${(c.amount_withheld_cents / 100).toFixed(2)}</strong>
                  </span>
                  <span>
                    Deadline: {format(deadline, "MMM d, yyyy")}
                    {daysOverdue > 0 && (
                      <strong className="text-destructive ml-1">
                        ({daysOverdue} days overdue)
                      </strong>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
