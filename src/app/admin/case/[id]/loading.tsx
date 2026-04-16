export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 bg-muted rounded w-56" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-muted h-28" />
          <div className="rounded-xl bg-muted h-48" />
          <div className="rounded-xl bg-muted h-64" />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl bg-muted h-52" />
          <div className="rounded-xl bg-muted h-36" />
        </div>
      </div>
    </div>
  );
}
