export function TicketsQuickFiltersSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={`tickets-quick-filter-${index}`}
          className="h-8 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-900"
        />
      ))}
    </div>
  );
}
