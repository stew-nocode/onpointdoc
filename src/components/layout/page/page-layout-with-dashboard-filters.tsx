import type { ReactNode } from 'react';
import { PageContent } from './page-content';
import { DashboardFiltersSidebarProvider } from '@/components/dashboard/ceo/filters/dashboard-filters-sidebar-context';
import { DashboardFiltersContentWrapper } from '@/components/dashboard/ceo/filters/dashboard-filters-content-wrapper';
import type { PageHeaderConfig, PageCardConfig } from './types';

type PageLayoutWithDashboardFiltersProps = {
  sidebar: ReactNode;
  header: PageHeaderConfig;
  kpis?: ReactNode;
  card: PageCardConfig;
  children: ReactNode;
};

/**
 * Layout principal avec sidebar de filtres dashboard
 * 
 * Gère automatiquement DashboardFiltersSidebarProvider et DashboardFiltersContentWrapper
 * 
 * @param sidebar - Sidebar de filtres (doit être DashboardFiltersSidebarClient)
 * @param header - Configuration du header
 * @param kpis - Section KPIs optionnelle
 * @param card - Configuration de la card principale
 * @param children - Contenu principal de la card
 */
export function PageLayoutWithDashboardFilters({
  sidebar,
  header,
  kpis,
  card,
  children
}: PageLayoutWithDashboardFiltersProps) {
  const content = (
    <PageContent header={header} kpis={kpis} card={card}>
      {children}
    </PageContent>
  );

  return (
    <DashboardFiltersSidebarProvider>
      {sidebar}
      <DashboardFiltersContentWrapper>{content}</DashboardFiltersContentWrapper>
    </DashboardFiltersSidebarProvider>
  );
}

