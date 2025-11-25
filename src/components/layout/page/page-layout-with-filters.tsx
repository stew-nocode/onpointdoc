import type { ReactNode } from 'react';
import { PageContent } from './page-content';
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
  const content = (
    <PageContent header={header} kpis={kpis} card={card}>
      {children}
    </PageContent>
  );

  return (
    <FiltersSidebarProvider>
      {sidebar}
      <FiltersContentWrapper>{content}</FiltersContentWrapper>
    </FiltersSidebarProvider>
  );
}

