'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * Composant lazy pour charger TasksKPISection
 * Améliore les performances en évitant de charger les KPIs immédiatement
 * 
 * Pattern identique à ActivitiesKPISectionLazy pour cohérence
 */
const TasksKPISection = dynamic(
  () => import('./tasks-kpi-section').then((mod) => ({ default: mod.TasksKPISection })),
  {
    loading: () => (
      <div className="kpi-grid-responsive gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="w-full h-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center"
          >
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ))}
      </div>
    ),
    ssr: false // Les KPIs dépendent des données utilisateur, pas besoin de SSR
  }
);

type TasksKPISectionLazyProps = {
  kpis: Parameters<typeof import('./tasks-kpi-section').TasksKPISection>[0]['kpis'];
  hasProfile: boolean;
};

/**
 * Wrapper lazy pour TasksKPISection
 * 
 * @param props - Propriétés passées à TasksKPISection
 */
export function TasksKPISectionLazy({ kpis, hasProfile }: TasksKPISectionLazyProps) {
  return <TasksKPISection kpis={kpis} hasProfile={hasProfile} />;
}

