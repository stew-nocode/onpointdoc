import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import {
  getCompanyTicketsDistributionStats,
  getCompanyTicketsEvolutionStats,
  getCompanyTicketsByProductModuleStats,
} from '@/services/companies/stats';
import { getPeriodRange, parsePeriodFromParams } from '@/lib/utils/period-utils';
import type { Period } from '@/types/dashboard';
import { CompanyStatsPeriodSelector } from './company-stats-period-selector';
import {
  CompanyTicketsDistributionChart,
  CompanyTicketsEvolutionChart,
  CompanyTicketsByProductModuleChart,
} from './charts/lazy-company-charts';
import {
  CompanyTicketsDistributionChartSkeleton,
  CompanyTicketsEvolutionChartSkeleton,
  CompanyTicketsByProductModuleChartSkeleton,
} from './charts';

type CompanyStatsProps = {
  companyId: string;
  period?: string;
};

/**
 * Composant streamable pour les statistiques de l'entreprise
 * 
 * ✅ Optimisation Phase 1 : Streaming granulaire
 * - Composant séparé pour permettre le streaming
 * - Charge les stats en parallèle
 * - Wrapped dans Suspense dans la page parente
 */
export async function CompanyStats({ companyId, period }: CompanyStatsProps) {
  const parsedPeriod = parsePeriodFromParams(period);
  const { periodStart, periodEnd } = getPeriodRange(parsedPeriod);

  // Charger toutes les stats en parallèle
  const [distributionStats, evolutionStats, productModuleStats] = await Promise.all([
    getCompanyTicketsDistributionStats(companyId, periodStart, periodEnd),
    getCompanyTicketsEvolutionStats(companyId, periodStart, periodEnd, parsedPeriod),
    getCompanyTicketsByProductModuleStats(companyId, periodStart, periodEnd, 10),
  ]);

  return (
    <div className="lg:col-span-3 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Statistiques</CardTitle>
            <Suspense
              fallback={
                <div className="h-10 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              }
            >
              <CompanyStatsPeriodSelector />
            </Suspense>
          </div>
        </CardHeader>
        <CardContent>
          {/* Container flexbox avec wrap pour les charts */}
          <div className="flex flex-wrap gap-4">
            <Suspense fallback={<CompanyTicketsDistributionChartSkeleton />}>
              <CompanyTicketsDistributionChart data={distributionStats} />
            </Suspense>
            <Suspense fallback={<CompanyTicketsEvolutionChartSkeleton />}>
              <CompanyTicketsEvolutionChart data={evolutionStats} />
            </Suspense>
            <Suspense fallback={<CompanyTicketsByProductModuleChartSkeleton />}>
              <CompanyTicketsByProductModuleChart data={productModuleStats} />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Skeleton pour le composant CompanyStats
 * 
 * Affiche un placeholder pendant le chargement
 */
export function CompanyStatsSkeleton() {
  return (
    <div className="lg:col-span-3 space-y-4 animate-pulse">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-[400px] w-full rounded bg-slate-200 dark:bg-slate-700"
                style={{ minWidth: '320px', flex: '1 1 0' }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

