import { getCompanyById } from '@/services/companies/get-company-by-id';
import { loadCompanyHistory } from '@/services/companies/company-history';
import { CompanyTimeline } from './company-timeline';

type CompanyTimelineWrapperProps = {
  companyId: string;
};

/**
 * Composant streamable pour la timeline de l'entreprise
 * 
 * ✅ Optimisation Phase 1 : Streaming granulaire
 * - Composant séparé pour permettre le streaming
 * - Charge l'historique (données non critiques)
 * - Wrapped dans Suspense dans la page parente
 * - Streamé en dernier car non critique pour l'affichage initial
 */
export async function CompanyTimelineWrapper({ companyId }: CompanyTimelineWrapperProps) {
  // Charger l'entreprise et l'historique en parallèle
  const [company, history] = await Promise.all([
    getCompanyById(companyId),
    loadCompanyHistory(companyId),
  ]);

  return (
    <CompanyTimeline
      history={history}
      companyName={company?.name || 'Entreprise'}
    />
  );
}

/**
 * Skeleton pour le composant CompanyTimelineWrapper
 * 
 * Affiche un placeholder pendant le chargement
 */
export function CompanyTimelineSkeleton() {
  return (
    <div className="w-96 flex-shrink-0 animate-pulse">
      <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 p-6">
          <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="relative flex gap-4">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

