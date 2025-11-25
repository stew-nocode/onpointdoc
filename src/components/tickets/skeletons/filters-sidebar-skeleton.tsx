const FILTER_PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => `filters-skeleton-${index}`);

export function FiltersSidebarSkeleton() {
  return (
    <div className="hidden h-full w-64 flex-shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 lg:block">
      <div className="mb-4 h-10 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-3">
        {FILTER_PLACEHOLDERS.map((rowKey) => (
          <div key={rowKey} className="h-9 animate-pulse rounded-md bg-slate-100 dark:bg-slate-900" />
        ))}
      </div>
    </div>
  );
}
