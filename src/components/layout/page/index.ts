/**
 * Composants de layout standardisés pour les pages de gestion
 * 
 * Architecture :
 * - PageLayout : Composant principal orchestrateur (sidebar générique)
 * - PageLayoutWithFilters : Layout avec sidebar de filtres (spécifique tickets)
 * - PageContent : Contenu standardisé (header, kpis, card)
 * - PageHeader : Header standardisé
 * - PageKPISection : Section KPIs wrapper
 * - PageCard : Card principale avec slots
 * - PageSidebarWrapper : Wrapper générique pour sidebar
 * - PageSidebarProvider/usePageSidebar : Context pour sidebar
 * - Types : Types partagés (PageHeaderConfig, PageCardConfig)
 */

export { PageLayout } from './page-layout';
export { PageLayoutWithFilters } from './page-layout-with-filters';
export { PageLayoutWithDashboardFilters } from './page-layout-with-dashboard-filters';
export { PageContent } from './page-content';
export { PageHeader } from './page-header';
export { StandardPageHeader } from './standard-page-header';
export { PageKPISection } from './page-kpi-section';
export { PageCard } from './page-card';
export { PageSidebarWrapper } from './page-sidebar-wrapper';
export { PageSidebarProvider, usePageSidebar } from './page-sidebar-context';
export type { PageHeaderConfig, PageCardConfig } from './types';

