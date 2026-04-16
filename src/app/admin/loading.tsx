export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 bg-muted rounded w-32" />
      <div className="rounded-xl border overflow-hidden">
        <div className="h-11 bg-muted/60 border-b" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-14 border-b last:border-0 bg-muted/20" />
        ))}
      </div>
    </div>
  );
}
