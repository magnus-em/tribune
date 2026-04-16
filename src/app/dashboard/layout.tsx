import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar, type SidebarTenantCase } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";


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
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-medium">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
