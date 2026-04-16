export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div className="h-7 bg-muted rounded w-56" />
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-muted h-24" />
          <div className="rounded-xl bg-muted h-36" />
          <div className="rounded-xl bg-muted h-64" />
        </div>
        {/* Side column */}
        <div className="space-y-4">
          <div className="rounded-xl bg-muted h-44" />
          <div className="rounded-xl bg-muted h-32" />
          <div className="rounded-xl bg-muted h-28" />
        </div>
      </div>
    </div>
  );
}
