import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar, type SidebarTenantCase } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import s from "./dashboard.module.css";


// Fetches profile + case data and renders the fully-populated sidebar.
// Wrapped in Suspense so the layout shell renders before this completes.
async function SidebarData({ userId, email }: { userId: string; email: string }) {
  const supabase = await createClient();
  const [{ data: profile }, { data: tenantCase }] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", userId).single(),
    supabase
      .from("cases")
      .select("id, status, statutory_deadline, amount_withheld_cents, contingency_pct")
      .eq("tenant_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <AppSidebar
      email={email}
      isAdmin={profile?.is_admin ?? false}
      tenantCase={tenantCase as SidebarTenantCase | null}
    />
  );
}

function SidebarFallback({ email }: { email: string }) {
  return (
    <AppSidebar
      email={email}
      isAdmin={false}
      tenantCase={null}
      loading={true}
    />
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only block on auth — shell renders as soon as this resolves
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarFallback email={user.email ?? ""} />}>
        <SidebarData userId={user.id} email={user.email ?? ""} />
      </Suspense>
      <SidebarInset>
        <header className={s.header}>
          <div className={s.headerLeft}>
            <SidebarTrigger className="-ml-1" />
            <div className={s.vSep} />
            <span className={s.headerLabel}>Dashboard</span>
          </div>
          <span className={s.headerRight}><b>§</b> 47a-21</span>
        </header>
        <div className="flex-1 overflow-auto">
          <div className={`max-w-2xl mx-auto px-4 sm:px-6 py-8 ${s.page}`}>{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
