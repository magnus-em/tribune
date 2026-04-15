"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type Case, STATUS_LABELS, type CaseStatus } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { statusColor, formatCents } from "@/lib/utils/case";
import { format, differenceInDays } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CaseWithProfile extends Case {
  profiles: { full_name: string; email: string } | null;
}

const columns: ColumnDef<CaseWithProfile>[] = [
  {
    accessorKey: "tenant",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3"
      >
        Tenant <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.profiles?.full_name || "Unknown"}
        </div>
        <div className="text-xs text-muted-foreground">
          {row.original.profiles?.email || ""}
        </div>
      </div>
    ),
    sortingFn: (a, b) => {
      const aName = a.original.profiles?.full_name || "";
      const bName = b.original.profiles?.full_name || "";
      return aName.localeCompare(bName);
    },
    filterFn: (row, _columnId, filterValue) => {
      const search = (filterValue as string).toLowerCase();
      const name = row.original.profiles?.full_name?.toLowerCase() || "";
      const email = row.original.profiles?.email?.toLowerCase() || "";
      const address = row.original.property_address?.toLowerCase() || "";
      return name.includes(search) || email.includes(search) || address.includes(search);
    },
  },
  {
    accessorKey: "property_address",
    header: "Property",
    cell: ({ getValue }) => (
      <span className="text-sm">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue() as CaseStatus;
      return (
        <Badge variant="outline" className={statusColor(status)}>
          {STATUS_LABELS[status]}
        </Badge>
      );
    },
    filterFn: (row, _columnId, filterValue) => {
      if (filterValue === "all") return true;
      return row.original.status === filterValue;
    },
  },
  {
    accessorKey: "amount_withheld_cents",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3"
      >
        Withheld <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="font-medium">{formatCents(getValue() as number)}</span>
    ),
  },
  {
    accessorKey: "statutory_deadline",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3"
      >
        Deadline <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const deadline = new Date(row.original.statutory_deadline);
      const daysOverdue = differenceInDays(new Date(), deadline);
      const isOverdue =
        daysOverdue > 0 &&
        !["resolved", "closed"].includes(row.original.status);
      return (
        <div className="flex items-center gap-1.5">
          <span>{format(deadline, "MMM d")}</span>
          {isOverdue && (
            <span className="text-destructive text-xs font-medium">
              +{daysOverdue}d
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-3"
      >
        Created <ArrowUpDown className="ml-1 size-3" />
      </Button>
    ),
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(getValue() as string), "MMM d, yyyy")}
      </span>
    ),
  },
];

function StatCard({
  label,
  value,
  icon,
  subtext,
  variant,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  subtext?: string;
  variant?: "default" | "warning" | "danger";
}) {
  const bg =
    variant === "danger"
      ? "bg-red-50 border-red-200"
      : variant === "warning"
        ? "bg-yellow-50 border-yellow-200"
        : "bg-card";

  return (
    <Card className={`rounded-xl ${bg}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {icon}
        </div>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const stats = useMemo(() => {
    const total = cases.length;
    const active = cases.filter(
      (c) => !["resolved", "closed"].includes(c.status)
    ).length;
    const overdue = cases.filter((c) => {
      const deadline = new Date(c.statutory_deadline);
      return (
        differenceInDays(new Date(), deadline) > 0 &&
        !["resolved", "closed"].includes(c.status)
      );
    }).length;
    const needsAttention = cases.filter((c) =>
      ["intake_submitted", "landlord_responded"].includes(c.status)
    ).length;
    const totalWithheld = cases.reduce(
      (sum, c) => sum + c.amount_withheld_cents,
      0
    );
    return { total, active, overdue, needsAttention, totalWithheld };
  }, [cases]);

  const statusCounts = useMemo(() => {
    return cases.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [cases]);

  const filteredCases = useMemo(() => {
    let result = cases;
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    return result;
  }, [cases, statusFilter]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Cases</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and review tenant cases.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Cases"
          value={stats.total}
          icon={<TrendingUp className="size-4 text-muted-foreground" />}
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={<Clock className="size-4 text-blue-600" />}
        />
        <StatCard
          label="Needs Attention"
          value={stats.needsAttention}
          icon={<AlertCircle className="size-4 text-orange-600" />}
          variant={stats.needsAttention > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={<AlertCircle className="size-4 text-red-600" />}
          variant={stats.overdue > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Total Withheld"
          value={formatCents(stats.totalWithheld)}
          icon={<CheckCircle2 className="size-4 text-muted-foreground" />}
          subtext={`across ${stats.total} cases`}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses ({stats.total})</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label} ({statusCounts[value] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCases}
        searchKey="tenant"
        searchValue={searchQuery}
        onRowClick={(row) => router.push(`/admin/case/${row.id}`)}
      />
    </div>
  );
}
