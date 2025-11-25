import { ReactNode } from 'react';
import { PageContent } from './page-content';
import { PageSidebarWrapper } from './page-sidebar-wrapper';
import type { PageHeaderConfig, PageCardConfig } from './types';

type PageLayoutProps = {
  sidebar?: ReactNode;
  header: PageHeaderConfig;
  kpis?: ReactNode;
  card: PageCardConfig;
  children: ReactNode;
};

/**
 * Layout principal standardisé pour les pages de gestion
 * 
 * Structure commune :
 * - Sidebar optionnelle (filtres, navigation, etc.)
 * - Header standardisé (label, titre, description, action)
 * - Section KPIs optionnelle
 * - Card principale avec slots (titre, recherche, filtres, contenu)
 * 
 * Responsive :
 * - Sidebar en overlay sur mobile
 * - Sidebar fixe sur desktop avec ajustement du contenu
 * 
 * Pour les pages avec sidebar de filtres (tickets), utiliser PageLayoutWithFilters
 * 
 * @param sidebar - Sidebar optionnelle (utilise PageSidebarWrapper)
 * @param header - Configuration du header
 * @param kpis - Section KPIs optionnelle
 * @param card - Configuration de la card principale
 * @param children - Contenu principal de la card
 */
export function PageLayout({
  sidebar,
  header,
  kpis,
  card,
  children
}: PageLayoutProps) {
  const content = (
    <PageContent header={header} kpis={kpis} card={card}>
      {children}
    </PageContent>
  );

  // Si une sidebar simple est fournie, utiliser PageSidebarWrapper
  if (sidebar) {
    return <PageSidebarWrapper sidebar={sidebar}>{content}</PageSidebarWrapper>;
  }

  // Pas de sidebar
  return content;
}

