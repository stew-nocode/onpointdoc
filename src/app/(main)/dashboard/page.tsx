import { unstable_noStore as noStore } from 'next/cache';
import { getCEODashboardData } from '@/services/dashboard/ceo-kpis';
import { PageLayoutWithDashboardFilters } from '@/components/layout/page';
import { CEODashboard } from '@/components/dashboard/ceo/ceo-dashboard';
import { DashboardFiltersSidebarClient } from '@/components/dashboard/ceo/filters/dashboard-filters-sidebar-client';
import { listProducts } from '@/services/products';
import { parseDashboardFiltersFromParams } from '@/lib/utils/dashboard-filters-utils';

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Page du dashboard CEO/DAF
 * 
 * Affiche les KPIs stratégiques avec rafraîchissement temps réel
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  noStore();

  const resolvedSearchParams = await searchParams;
  const params = resolvedSearchParams || {};
  const filters = parseDashboardFiltersFromParams(params);
  const period = filters?.period || 'month';

  const [initialData, products] = await Promise.all([
    getCEODashboardData(period, filters || undefined),
    listProducts()
  ]);

  return (
    <PageLayoutWithDashboardFilters
      sidebar={<DashboardFiltersSidebarClient products={products.map(p => ({ id: p.id, name: p.name }))} />}
      header={{
        label: 'Dashboard',
        title: 'Tableau de bord Direction',
        description: 'Vue stratégique des performances et indicateurs clés'
      }}
      card={{
        title: 'Indicateurs de performance'
      }}
    >
      <CEODashboard initialData={initialData} initialPeriod={period} />
    </PageLayoutWithDashboardFilters>
  );
}
