const ROW_PLACEHOLDERS = Array.from({ length: 6 }, (_, index) => `tickets-row-${index}`);

export function TicketsListSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-6 w-40 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 w-full max-w-sm animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="mt-6 space-y-3">
        {ROW_PLACEHOLDERS.map((rowKey) => (
          <div key={rowKey} className="h-12 animate-pulse rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-900 dark:bg-slate-900" />
        ))}
      </div>
    </div>
  );
}
