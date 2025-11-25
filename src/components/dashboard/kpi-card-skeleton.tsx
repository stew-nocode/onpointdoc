export function KPICardSkeleton() {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 animate-pulse">
      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
      <div className="h-6 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  );
}
