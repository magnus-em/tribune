export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero net recovery card */}
      <div className="rounded-2xl bg-muted h-44" />
      {/* Status + deadline */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-muted h-28" />
        <div className="rounded-xl bg-muted h-28" />
      </div>
      {/* CTA */}
      <div className="rounded-xl bg-muted h-14" />
    </div>
  );
}
