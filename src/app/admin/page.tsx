"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { Search, ArrowUpDown, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";

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

type SortField = "created_at" | "statutory_deadline" | "amount_withheld_cents" | "tenant_name";
type SortDirection = "asc" | "desc";

export default function AdminPage() {
  const [cases, setCases] = useState<CaseWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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

  // Statistics
  const stats = useMemo(() => {
    const total = cases.length;
    const active = cases.filter((c) => !["resolved", "closed", "dead"].includes(c.status)).length;
    const resolved = cases.filter((c) => c.status === "resolved").length;
    const overdue = cases.filter((c) => {
      const deadline = new Date(c.statutory_deadline);
      return differenceInDays(new Date(), deadline) > 0 && !["resolved", "closed"].includes(c.status);
    }).length;
    const needsAttention = cases.filter((c) =>
      ["intake_submitted", "landlord_responded", "awaiting_tenant"].includes(c.status)
    ).length;

    const totalWithheld = cases.reduce((sum, c) => sum + c.amount_withheld_cents, 0);

    return {
      total,
      active,
      resolved,
      overdue,
      needsAttention,
      totalWithheld,
    };
  }, [cases]);

  // Filter and sort
  const filteredAndSortedCases = useMemo(() => {
    let filtered = cases;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.profiles?.full_name?.toLowerCase().includes(query) ||
          c.profiles?.email?.toLowerCase().includes(query) ||
          c.property_address?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case "created_at":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case "statutory_deadline":
          aVal = new Date(a.statutory_deadline).getTime();
          bVal = new Date(b.statutory_deadline).getTime();
          break;
        case "amount_withheld_cents":
          aVal = a.amount_withheld_cents;
          bVal = b.amount_withheld_cents;
          break;
        case "tenant_name":
          aVal = a.profiles?.full_name || "";
          bVal = b.profiles?.full_name || "";
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (sortDirection === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [cases, statusFilter, searchQuery, sortField, sortDirection]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  const statusCounts = cases.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-slate-200 rounded w-20 mb-2 animate-pulse" />
              <div className="h-8 bg-slate-200 rounded w-12 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="border rounded-lg p-8">
          <div className="h-4 bg-slate-200 rounded w-full mb-4 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-full mb-4 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">All Cases ({stats.total})</h1>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Cases"
          value={stats.total}
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<Clock className="h-4 w-4 text-blue-600" />}
          subtext={`${stats.resolved} resolved`}
        />
        <StatCard
          label="Needs Attention"
          value={stats.needsAttention}
          icon={<AlertCircle className="h-4 w-4 text-orange-600" />}
          highlight={stats.needsAttention > 0}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={<AlertCircle className="h-4 w-4 text-red-600" />}
          highlight={stats.overdue > 0}
          variant="danger"
        />
        <StatCard
          label="Total Withheld"
          value={`$${(stats.totalWithheld / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          icon={<CheckCircle2 className="h-4 w-4 text-slate-600" />}
          subtext={`across ${stats.total} cases`}
        />
      </div>

      {/* Cases Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("tenant_name")}
                  className="hover:bg-transparent"
                >
                  Tenant
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("amount_withheld_cents")}
                  className="hover:bg-transparent"
                >
                  Withheld
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("statutory_deadline")}
                  className="hover:bg-transparent"
                >
                  Deadline
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleSort("created_at")}
                  className="hover:bg-transparent"
                >
                  Created
                  <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" ? (
                      <>
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No cases found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No cases yet</p>
                        <p className="text-sm mt-1">Cases will appear here as tenants submit intakes</p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedCases.map((c) => {
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
                      <Link href={`/admin/case/${c.id}`} className="block text-sm">
                        {c.property_address}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(c.status)}>
                        {STATUS_LABELS[c.status as CaseStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(c.amount_withheld_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {format(deadline, "MMM d")}
                        {daysOverdue > 0 && !["resolved", "closed"].includes(c.status) && (
                          <span className="text-destructive text-xs font-medium">
                            +{daysOverdue}d
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(c.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedCases.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {filteredAndSortedCases.length} of {cases.length} cases
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  subtext,
  highlight,
  variant,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  subtext?: string;
  highlight?: boolean;
  variant?: "danger";
}) {
  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        highlight
          ? variant === "danger"
            ? "bg-red-50 border-red-200"
            : "bg-yellow-50 border-yellow-200"
          : "bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}
