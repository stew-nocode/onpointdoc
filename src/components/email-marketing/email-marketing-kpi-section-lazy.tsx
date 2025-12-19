'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * Composant lazy pour charger EmailMarketingKPISection
 * Améliore les performances en évitant de charger les KPIs immédiatement
 * 
 * Pattern identique à TasksKPISectionLazy pour cohérence
 */
const EmailMarketingKPISection = dynamic(
  () => import('./email-marketing-kpi-section').then((mod) => ({ default: mod.EmailMarketingKPISection })),
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

type EmailMarketingKPISectionLazyProps = {
  kpis: Parameters<typeof import('./email-marketing-kpi-section').EmailMarketingKPISection>[0]['kpis'];
  hasProfile?: boolean;
};

/**
 * Wrapper lazy pour EmailMarketingKPISection
 * 
 * @param props - Propriétés passées à EmailMarketingKPISection
 */
export function EmailMarketingKPISectionLazy({ kpis, hasProfile }: EmailMarketingKPISectionLazyProps) {
  return <EmailMarketingKPISection kpis={kpis} hasProfile={hasProfile} />;
}

