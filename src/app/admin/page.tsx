"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { type Case, STATUS_LABELS, type CaseStatus } from "@/lib/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";

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

interface CaseWithProfile extends Case {
  profiles: { full_name: string; email: string } | null;
}

export default function AdminPage() {
  const [cases, setCases] = useState<CaseWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("cases")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false });

      setCases(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filteredCases =
    filter === "all" ? cases : cases.filter((c) => c.status === filter);

  const statusCounts = cases.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return <p className="text-muted-foreground">Loading cases...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All Cases ({cases.length})</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label} ({statusCounts[value] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Cases" value={cases.length} />
        <StatCard
          label="Needs Attention"
          value={
            (statusCounts["intake_submitted"] || 0) +
            (statusCounts["landlord_responded"] || 0)
          }
        />
        <StatCard label="Active" value={cases.filter((c) => !["resolved", "closed"].includes(c.status)).length} />
        <StatCard label="Resolved" value={statusCounts["resolved"] || 0} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Withheld</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCases.map((c) => {
            const deadline = new Date(c.statutory_deadline);
            const daysOverdue = differenceInDays(new Date(), deadline);

            return (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link href={`/admin/case/${c.id}`} className="block">
                    <div className="font-medium">
                      {c.profiles?.full_name || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.profiles?.email || ""}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/case/${c.id}`} className="block">
                    {c.property_address}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColor(c.status)}>
                    {STATUS_LABELS[c.status as CaseStatus]}
                  </Badge>
                </TableCell>
                <TableCell>${(c.amount_withheld_cents / 100).toFixed(2)}</TableCell>
                <TableCell>
                  {format(deadline, "MMM d")}
                  {daysOverdue > 0 && (
                    <span className="text-destructive text-xs ml-1">+{daysOverdue}d</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(c.created_at), "MMM d")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
