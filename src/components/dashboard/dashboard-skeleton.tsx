/**
 * Skeleton de chargement pour le dashboard
 * 
 * ✅ OPTIMISÉ : Utilisé dans Suspense boundaries pour affichage progressif
 * 
 * Principe Clean Code - Niveau Senior :
 * - Design cohérent avec le dashboard final
 * - Animation subtile pour meilleure UX
 * - Responsive et accessible
 */

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header avec sélecteur de période */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-32 rounded-md bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Grille de widgets KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Widgets Charts et Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="space-y-4">
              <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-64 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton pour un widget individuel
 * 
 * Utilisé pour le chargement progressif de widgets spécifiques
 */
export function WidgetSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 animate-pulse">
      <div className="space-y-4">
        <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-32 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}


