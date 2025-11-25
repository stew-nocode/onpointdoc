const KPIS_PLACEHOLDER = Array.from({ length: 4 }, (_, index) => `kpi-skeleton-${index}`);

export function TicketsKPIsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {KPIS_PLACEHOLDER.map((key) => (
        <div key={key} className="h-24 animate-pulse rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900" />
      ))}
    </div>
  );
}
