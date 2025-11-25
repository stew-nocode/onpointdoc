const PLACEHOLDER_ROWS = Array.from({ length: 6 }, (_, index) => `table-row-${index}`);

export function TableCardSkeleton() {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 h-[420px] flex flex-col p-4 shadow-sm animate-pulse">
      <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
      <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
      <div className="flex-1 space-y-3">
        {PLACEHOLDER_ROWS.map((rowKey) => (
          <div key={rowKey} className="flex items-center gap-3">
            <div className="h-3 flex-1 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
