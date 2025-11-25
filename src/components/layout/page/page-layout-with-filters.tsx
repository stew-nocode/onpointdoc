import type { ReactNode } from 'react';
import { PageHeader } from './page-header';
import { PageKPISection } from './page-kpi-section';
import { PageCard } from './page-card';
import { FiltersSidebarProvider } from '@/components/tickets/filters/filters-sidebar-context';
import { FiltersContentWrapper } from '@/components/tickets/filters/filters-content-wrapper';
import type { PageHeaderConfig, PageCardConfig } from './types';

type PageLayoutWithFiltersProps = {
  sidebar: ReactNode;
  header: PageHeaderConfig;
  kpis?: ReactNode;
  card: PageCardConfig;
  children: ReactNode;
};

/**
 * Layout principal avec sidebar de filtres (spécifique pour tickets)
 * 
 * Gère automatiquement FiltersSidebarProvider et FiltersContentWrapper
 * 
 * @param sidebar - Sidebar de filtres (doit être FiltersSidebarClient)
 * @param header - Configuration du header
 * @param kpis - Section KPIs optionnelle
 * @param card - Configuration de la card principale
 * @param children - Contenu principal de la card
 */
export function PageLayoutWithFilters({
  sidebar,
  header,
  kpis,
  card,
  children
}: PageLayoutWithFiltersProps) {
  return (
    <>
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <PageHeader
          label={header.label}
          title={header.title}
          description={header.description}
          action={header.action}
        />
      </div>
      <FiltersSidebarProvider>
        {sidebar}
        <FiltersContentWrapper>
          <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            {kpis && <PageKPISection>{kpis}</PageKPISection>}
            <PageCard
              title={card.title}
              titleSuffix={card.titleSuffix}
              search={card.search}
              quickFilters={card.quickFilters}
            >
              {children}
            </PageCard>
          </div>
        </FiltersContentWrapper>
      </FiltersSidebarProvider>
    </>
  );
}

