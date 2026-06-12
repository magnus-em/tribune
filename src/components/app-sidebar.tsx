"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  LogOut,
  ChevronsUpDown,
  Mail,
  ArrowRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent, resetUser } from "@/lib/analytics/posthog";
import { STATUS_LABELS } from "@/lib/types/database";
import { formatCents } from "@/lib/utils/case";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SidebarTenantCase {
  id: string;
  status: string;
  statutory_deadline: string | null;
  amount_withheld_cents: number | null;
  contingency_pct: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusDot(status: string): string {
  switch (status) {
    case "resolved": return "bg-green-500";
    case "landlord_responded": return "bg-orange-500";
    case "letter_sent":
    case "awaiting_landlord": return "bg-purple-500";
    case "correspondence_ready": return "bg-yellow-400";
    case "intake_submitted":
    case "under_review": return "bg-blue-500";
    default: return "bg-gray-400";
  }
}

function deadlineLabel(dateStr: string): { text: string; urgent: boolean } {
  const days = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) return { text: "Deadline passed", urgent: true };
  if (days === 0) return { text: "Deadline today", urgent: true };
  if (days <= 7) return { text: `${days}d until deadline`, urgent: true };
  return { text: `${days}d until deadline`, urgent: false };
}

// ─── Mini case card ────────────────────────────────────────────────────────────

function TenantCaseCard({ c }: { c: SidebarTenantCase }) {
  const label = STATUS_LABELS[c.status as keyof typeof STATUS_LABELS] ?? c.status;
  const net =
    c.amount_withheld_cents && c.amount_withheld_cents > 0
      ? Math.round(c.amount_withheld_cents * (1 - c.contingency_pct / 100))
      : null;
  const deadline = c.statutory_deadline ? deadlineLabel(c.statutory_deadline) : null;

  return (
    <Link
      href={`/dashboard/case/${c.id}`}
      className="block mx-2 mb-1 border border-border hover:border-foreground/30 hover:bg-sidebar-accent transition-colors p-3 space-y-2 group"
    >
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full shrink-0 ${statusDot(c.status)}`} />
        <span className="text-[11px] uppercase tracking-wider font-medium text-sidebar-foreground truncate" style={{ fontFamily: "var(--font-space-mono, monospace)" }}>{label}</span>
      </div>
      {deadline && (
        <p className={`text-xs ${deadline.urgent ? "text-destructive font-medium" : "text-muted-foreground"}`} style={{ fontFamily: "var(--font-space-mono, monospace)" }}>
          {deadline.text}
        </p>
      )}
      {net !== null && (
        <p className="text-xs text-muted-foreground">
          Est. net{" "}
          <span className="font-semibold text-sidebar-foreground" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>{formatCents(net)}</span>
        </p>
      )}
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-sidebar-foreground transition-colors" style={{ fontFamily: "var(--font-space-mono, monospace)" }}>
        View case <ArrowRight className="size-3" />
      </div>
    </Link>
  );
}

// ─── Nav items ─────────────────────────────────────────────────────────────────

const adminNav = [
  { label: "All Cases", href: "/admin", icon: Shield },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────

export function AppSidebar({
  email,
  isAdmin,
  tenantCase,
  adminPendingCount,
  loading = false,
}: {
  email: string;
  isAdmin: boolean;
  tenantCase?: SidebarTenantCase | null;
  adminPendingCount?: number;
  loading?: boolean;
}) {
  const pathname = usePathname();
  const initials = email.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={isAdmin ? "/admin" : "/dashboard"} />}
              tooltip="Tribune"
            >
              <div className="flex aspect-square size-7 shrink-0 items-center justify-center bg-white border border-border text-[#b8361f] italic text-lg leading-none select-none" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)", fontWeight: 700 }}>
                §
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="font-semibold tracking-tight" style={{ fontFamily: "var(--font-fraunces, Georgia, serif)" }}>Tribune</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "var(--font-space-mono, monospace)", letterSpacing: "0.1em" }}>CT § 47a-21</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Tenant case card — tenants only. Admins use the All Cases view. */}
        {!isAdmin && (
          loading ? (
            <SidebarGroup>
              <SidebarGroupLabel>Your Case</SidebarGroupLabel>
              <div className="mx-2 mb-1 rounded-lg border bg-sidebar-accent/30 p-3 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </SidebarGroup>
          ) : tenantCase ? (
            <SidebarGroup>
              <SidebarGroupLabel>Your Case</SidebarGroupLabel>
              <TenantCaseCard c={tenantCase} />
            </SidebarGroup>
          ) : null
        )}

        {/* Admin nav */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={
                        pathname === item.href ||
                        pathname.startsWith(item.href + "/")
                      }
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {adminPendingCount ? (
                      <SidebarMenuBadge>{adminPendingCount}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Help */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Contact support"
                  render={<a href="mailto:hello@usetribune.org" />}
                >
                  <Mail className="size-4" />
                  <span>Contact Support</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="size-7 rounded-md">
                  <AvatarFallback className="rounded-md bg-muted text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-xs text-muted-foreground">{email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                {isAdmin ? (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                    <Shield className="mr-2 size-4" />
                    All Cases
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem render={<Link href="/dashboard" />}>
                    <LayoutDashboard className="mr-2 size-4" />
                    Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    trackEvent("user_signed_out");
                    resetUser();
                    const form = document.createElement("form");
                    form.method = "post";
                    form.action = "/auth/signout";
                    document.body.appendChild(form);
                    form.submit();
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
