import { DashboardExample } from '@/components/dashboard/tremor/dashboard-example';
import { getCEODashboardData } from '@/services/dashboard/ceo-kpis';

/**
 * Page de test pour le dashboard Tremor
 *
 * Cette page démontre les capacités de Tremor pour créer
 * des dashboards modernes et élégants avec dark mode automatique
 *
 * Accès : http://localhost:3000/dashboard-tremor-test
 */
export default async function DashboardTremorTestPage() {
  // Charger les données du dashboard
  const data = await getCEODashboardData('month');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Dashboard Tremor - Démo
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Dashboard moderne avec Tremor - Dark mode automatique, design élégant
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Dark mode automatique
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                -50% de code
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Design cohérent
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <DashboardExample
          data={{
            role: 'direction',
            strategic: data,
            alerts: data.alerts,
            period: 'month',
            periodStart: data.periodStart,
            periodEnd: data.periodEnd,
          }}
        />

        {/* Footer */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
            📊 Comparaison avec l'ancien dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">-50%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Lignes de code</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Auto</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Dark mode</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">100%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Cohérence design</div>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">
            Accède au dashboard actuel pour comparer :{' '}
            <a href="/dashboard" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              /dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
