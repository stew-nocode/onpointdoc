export function AnalyticsCardSkeleton() {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 animate-pulse h-[320px]">
      <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    </div>
  );
}
