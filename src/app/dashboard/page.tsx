"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { type Case, STATUS_LABELS } from "@/lib/types/database";

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

      // Check for pending case from intake form
      const pendingCase = sessionStorage.getItem("tribune_pending_case");
      if (pendingCase) {
        sessionStorage.removeItem("tribune_pending_case");
        const data = JSON.parse(pendingCase);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Update profile with phone if provided
          if (data.phone) {
            await supabase.from("profiles").update({ phone: data.phone }).eq("id", user.id);
          }

          // Create the case
          const { data: newCase } = await supabase
            .from("cases")
            .insert({
              tenant_id: user.id,
              property_address: data.property_address,
              unit_number: data.unit_number || null,
              landlord_name: data.landlord_name,
              landlord_email: data.landlord_email || null,
              landlord_phone: data.landlord_phone || null,
              landlord_address: data.landlord_address || null,
              lease_start_date: data.lease_start_date,
              lease_end_date: data.lease_end_date,
              move_out_date: data.move_out_date,
              forwarding_address: data.forwarding_address || null,
              deposit_amount_cents: data.deposit_amount_cents,
              deposit_returned_cents: 0,
              amount_withheld_cents: data.amount_withheld_cents,
              withholding_reason: data.withholding_reason,
              itemized_deductions_received: data.itemized_deductions_received,
              situation_description: data.situation_description,
              contingency_pct: data.contingency_pct,
              contingency_agreed_at: new Date().toISOString(),
              statutory_deadline: data.statutory_deadline,
            })
            .select()
            .single();

          // Create welcome message
          if (newCase) {
            await supabase.from("case_messages").insert({
              case_id: newCase.id,
              message_type: "system",
              title: "Welcome to Tribune",
              body: "We've received your case and will review it shortly. You'll be notified when your first demand letter is ready.",
              created_by: user.id,
            });
          }
        }
      }

      // Load all cases
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
