'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * Composant lazy pour charger ActivitiesKPISection
 * Améliore les performances en évitant de charger les KPIs immédiatement
 * 
 * Pattern identique à TicketsKPISectionLazy pour cohérence
 */
const ActivitiesKPISection = dynamic(
  () => import('./activities-kpi-section').then((mod) => ({ default: mod.ActivitiesKPISection })),
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

type ActivitiesKPISectionLazyProps = {
  kpis: Parameters<typeof import('./activities-kpi-section').ActivitiesKPISection>[0]['kpis'];
  hasProfile: boolean;
};

/**
 * Wrapper lazy pour ActivitiesKPISection
 * 
 * @param props - Propriétés passées à ActivitiesKPISection
 */
export function ActivitiesKPISectionLazy({ kpis, hasProfile }: ActivitiesKPISectionLazyProps) {
  return <ActivitiesKPISection kpis={kpis} hasProfile={hasProfile} />;
}
