export function PageSkeleton() {
  return (
    <div className="page-skeleton space-y-6" aria-busy="true" aria-label="Đang tải">
      <div className="h-8 w-48 max-w-[60%] rounded-lg bg-[var(--border)]/80" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-24 animate-pulse bg-[var(--card-muted)]" />
        ))}
      </div>
      <div className="card h-64 animate-pulse bg-[var(--card-muted)]" />
    </div>
  );
}
